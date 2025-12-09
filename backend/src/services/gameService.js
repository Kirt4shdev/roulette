import { query, getClient } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { questionService } from './questionService.js';
import { prizeService } from './prizeService.js';

export const gameService = {
  /**
   * Crear un nuevo juego
   */
  async createGame(questionsPerRound = 3) {
    // Resetear premios y preguntas antes de crear un nuevo juego
    await prizeService.resetPrizes();
    await questionService.resetAllQuestions();
    
    // Generar hash único de 8 caracteres
    const hash = crypto.randomBytes(4).toString('hex');
    
    const result = await query(
      `INSERT INTO games (hash, status, questions_per_round)
       VALUES ($1, $2, $3)
       RETURNING id, hash, status, questions_per_round, created_at`,
      [hash, 'waiting', questionsPerRound]
    );
    
    console.log('✅ Nuevo juego creado con premios y preguntas reseteados');
    
    return result.rows[0];
  },

  /**
   * Obtener juego por hash
   */
  async getGameByHash(hash) {
    const result = await query(
      'SELECT * FROM games WHERE hash = $1',
      [hash]
    );
    return result.rows[0] || null;
  },

  /**
   * Obtener juego por ID
   */
  async getGameById(gameId) {
    const result = await query(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    );
    return result.rows[0] || null;
  },

  /**
   * Agregar un jugador al juego
   */
  async addPlayer(gameId, playerName) {
    try {
      const result = await query(
        `INSERT INTO players (game_id, name, active)
         VALUES ($1, $2, $3)
         RETURNING id, game_id, name, active, prize_won, created_at`,
        [gameId, playerName, true]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // unique violation
        throw new Error('Ya existe un jugador con ese nombre en este juego');
      }
      throw error;
    }
  },

  /**
   * Obtener todos los jugadores de un juego
   */
  async getPlayers(gameId) {
    const result = await query(
      `SELECT id, game_id, name, active, prize_won, created_at
       FROM players
       WHERE game_id = $1
       ORDER BY created_at ASC`,
      [gameId]
    );
    return result.rows;
  },

  /**
   * Obtener jugadores activos (sin premio)
   */
  async getActivePlayers(gameId) {
    const result = await query(
      `SELECT id, game_id, name, active, prize_won
       FROM players
       WHERE game_id = $1 AND active = TRUE
       ORDER BY created_at ASC`,
      [gameId]
    );
    return result.rows;
  },

  /**
   * Iniciar el juego
   */
  async startGame(gameId) {
    const result = await query(
      `UPDATE games 
       SET status = 'running', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'waiting'
       RETURNING *`,
      [gameId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('No se puede iniciar el juego');
    }
    
    return result.rows[0];
  },

  /**
   * Crear una nueva ronda
   */
  async createRound(gameId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Obtener el número de la siguiente ronda
      const roundNumResult = await client.query(
        `SELECT COALESCE(MAX(round_number), 0) + 1 as next_round
         FROM rounds
         WHERE game_id = $1`,
        [gameId]
      );
      const roundNumber = roundNumResult.rows[0].next_round;
      
      // Obtener el juego para saber cuántas preguntas por ronda
      const game = await this.getGameById(gameId);
      const questionsPerRound = game.questions_per_round;
      
      // Obtener preguntas aleatorias
      const questions = await questionService.getRandomQuestions(questionsPerRound);
      
      if (questions.length < questionsPerRound) {
        throw new Error('No hay suficientes preguntas disponibles');
      }
      
      const questionIds = questions.map(q => q.id);
      
      // Crear la ronda
      const result = await client.query(
        `INSERT INTO rounds (game_id, round_number, question_ids, completed)
         VALUES ($1, $2, $3, $4)
         RETURNING id, game_id, round_number, question_ids, completed, created_at`,
        [gameId, roundNumber, questionIds, false]
      );
      
      await client.query('COMMIT');
      
      const round = result.rows[0];
      
      // Agregar las preguntas completas
      round.questions = questions;
      
      return round;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Guardar respuesta de un jugador
   */
  async savePlayerAnswer(playerId, roundId, questionId, answerGiven) {
    const isCorrect = await questionService.validateAnswer(questionId, answerGiven);
    
    const result = await query(
      `INSERT INTO player_answers (player_id, round_id, question_id, answer_given, is_correct)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [playerId, roundId, questionId, answerGiven.toUpperCase(), isCorrect]
    );
    
    return result.rows[0];
  },

  /**
   * Obtener ganadores de una ronda (jugadores que acertaron TODAS las preguntas)
   * Un ganador debe haber contestado TODAS las preguntas de la ronda Y todas correctas
   */
  async getRoundWinners(roundId) {
    // Primero obtener cuántas preguntas tiene la ronda
    const roundResult = await query(
      'SELECT array_length(question_ids, 1) as total_questions FROM rounds WHERE id = $1',
      [roundId]
    );
    
    if (roundResult.rows.length === 0) {
      return [];
    }
    
    const totalQuestions = roundResult.rows[0].total_questions;
    
    // Buscar jugadores que hayan contestado TODAS las preguntas Y todas correctas
    const result = await query(
      `SELECT 
         p.id, p.name, p.game_id,
         COUNT(pa.id) as total_answers,
         COUNT(pa.id) FILTER (WHERE pa.is_correct = TRUE) as correct_answers
       FROM players p
       INNER JOIN player_answers pa ON p.id = pa.player_id
       WHERE pa.round_id = $1 AND p.active = TRUE
       GROUP BY p.id, p.name, p.game_id
       HAVING COUNT(pa.id) = $2 
          AND COUNT(pa.id) FILTER (WHERE pa.is_correct = TRUE) = $2`,
      [roundId, totalQuestions]
    );
    
    return result.rows;
  },

  /**
   * Ejecutar la ruleta y asignar premio a un ganador
   */
  async spinRouletteAndAwardPrize(gameId, roundId, winners) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Seleccionar un ganador aleatorio
      const winnerIndex = Math.floor(Math.random() * winners.length);
      const winner = winners[winnerIndex];
      
      // Obtener el mejor premio disponible
      const prize = await prizeService.getBestAvailablePrize();
      
      if (!prize) {
        throw new Error('No hay premios disponibles');
      }
      
      // Asignar el premio
      await prizeService.awardPrize(prize.id);
      
      // Marcar jugador como inactivo y asignar premio
      await client.query(
        `UPDATE players 
         SET active = FALSE, prize_won = $1
         WHERE id = $2`,
        [prize.name, winner.id]
      );
      
      // Actualizar la ronda con el ganador
      await client.query(
        `UPDATE rounds 
         SET completed = TRUE, winner_id = $1, prize_awarded = $2
         WHERE id = $3`,
        [winner.id, prize.name, roundId]
      );
      
      await client.query('COMMIT');
      
      return {
        winner: {
          id: winner.id,
          name: winner.name
        },
        prize: {
          id: prize.id,
          name: prize.name,
          type: prize.type
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Verificar si el juego debe terminar
   */
  async shouldEndGame(gameId) {
    // El juego termina si:
    // 1. No quedan jugadores activos
    // 2. No quedan premios disponibles
    
    const activePlayers = await this.getActivePlayers(gameId);
    const hasActivePlayers = activePlayers.length > 0;
    
    const hasPrizes = await prizeService.hasAvailablePrizes();
    
    return !hasActivePlayers || !hasPrizes;
  },

  /**
   * Finalizar el juego
   */
  async finishGame(gameId) {
    const result = await query(
      `UPDATE games 
       SET status = 'finished', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [gameId]
    );
    
    return result.rows[0];
  },

  /**
   * Obtener resultados finales del juego
   */
  async getFinalResults(gameId) {
    const result = await query(
      `SELECT 
         p.id, p.name, p.prize_won, p.active,
         COUNT(DISTINCT r.id) as rounds_participated
       FROM players p
       LEFT JOIN player_answers pa ON p.id = pa.player_id
       LEFT JOIN rounds r ON pa.round_id = r.id
       WHERE p.game_id = $1
       GROUP BY p.id, p.name, p.prize_won, p.active
       ORDER BY p.active ASC, p.created_at ASC`,
      [gameId]
    );
    
    return result.rows;
  },

  /**
   * Eliminar un jugador
   */
  async removePlayer(playerId) {
    await query(
      'DELETE FROM players WHERE id = $1',
      [playerId]
    );
  }
};

