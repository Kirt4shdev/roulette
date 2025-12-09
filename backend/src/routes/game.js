import express from 'express';
import { gameService } from '../services/gameService.js';
import { query } from '../db.js';

const router = express.Router();

/**
 * GET /api/game/:hash
 * Obtener información básica del juego
 */
router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    const game = await gameService.getGameByHash(hash);
    
    if (!game) {
      return res.status(404).json({ error: 'Juego no encontrado' });
    }
    
    res.json({
      success: true,
      game: {
        id: game.id,
        hash: game.hash,
        status: game.status
      }
    });
  } catch (error) {
    console.error('Error obteniendo juego:', error);
    res.status(500).json({ error: 'Error al obtener el juego' });
  }
});

/**
 * POST /api/game/:hash/join
 * Unirse a un juego
 */
router.post('/:hash/join', async (req, res) => {
  try {
    const { hash } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    const game = await gameService.getGameByHash(hash);
    
    if (!game) {
      return res.status(404).json({ error: 'Juego no encontrado' });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'El juego ya ha comenzado' });
    }
    
    const player = await gameService.addPlayer(game.id, name.trim());
    
    res.status(201).json({
      success: true,
      player,
      game: {
        id: game.id,
        hash: game.hash,
        status: game.status
      }
    });
  } catch (error) {
    console.error('Error uniéndose al juego:', error);
    
    if (error.message.includes('Ya existe un jugador')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error al unirse al juego' });
  }
});

/**
 * GET /api/game/player/:playerId
 * Obtener información del jugador
 */
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    const result = await query(
      'SELECT id, game_id, name, active, prize_won FROM players WHERE id = $1',
      [playerId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    
    const player = result.rows[0];
    
    res.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        active: player.active,
        prizeWon: player.prize_won
      }
    });
  } catch (error) {
    console.error('Error obteniendo jugador:', error);
    res.status(500).json({ error: 'Error al obtener el jugador' });
  }
});

/**
 * POST /api/game/answer
 * Responder una pregunta
 */
router.post('/answer', async (req, res) => {
  try {
    const { playerId, roundId, questionId, answer } = req.body;
    
    if (!playerId || !roundId || !questionId || !answer) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    
    if (!['A', 'B', 'C', 'D'].includes(answer.toUpperCase())) {
      return res.status(400).json({ error: 'Respuesta inválida' });
    }
    
    const result = await gameService.savePlayerAnswer(
      playerId,
      roundId,
      questionId,
      answer
    );
    
    res.json({
      success: true,
      answer: {
        isCorrect: result.is_correct
      }
    });
  } catch (error) {
    console.error('Error guardando respuesta:', error);
    res.status(500).json({ error: 'Error al guardar la respuesta' });
  }
});

export default router;

