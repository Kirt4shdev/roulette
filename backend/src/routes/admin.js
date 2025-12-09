import express from 'express';
import { gameService } from '../services/gameService.js';
import { prizeService } from '../services/prizeService.js';
import { questionService } from '../services/questionService.js';
import { broadcastToAll, broadcastToGame, sendToPlayer, broadcastToAdmins } from '../websocket.js';
import { query } from '../db.js';

const router = express.Router();

// Middleware para verificar token de admin
const verifyAdminToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token || token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  next();
};

/**
 * POST /api/admin/games
 * Crear un nuevo juego
 */
router.post('/games', verifyAdminToken, async (req, res) => {
  try {
    const { questionsPerRound = 3 } = req.body;
    
    const game = await gameService.createGame(questionsPerRound);
    
    res.status(201).json({
      success: true,
      game,
      joinUrl: `/join/${game.hash}`
    });
  } catch (error) {
    console.error('Error creando juego:', error);
    res.status(500).json({ error: 'Error al crear el juego' });
  }
});

/**
 * GET /api/admin/games/:hash
 * Obtener información de un juego
 */
router.get('/games/:hash', verifyAdminToken, async (req, res) => {
  try {
    const { hash } = req.params;
    
    const game = await gameService.getGameByHash(hash);
    
    if (!game) {
      return res.status(404).json({ error: 'Juego no encontrado' });
    }
    
    const players = await gameService.getPlayers(game.id);
    const prizes = await prizeService.getAllPrizes();
    const questionStats = await questionService.getStats();
    
    res.json({
      success: true,
      game,
      players,
      prizes,
      questionStats
    });
  } catch (error) {
    console.error('Error obteniendo juego:', error);
    res.status(500).json({ error: 'Error al obtener el juego' });
  }
});

/**
 * POST /api/admin/games/:hash/start
 * Iniciar el juego
 */
router.post('/games/:hash/start', verifyAdminToken, async (req, res) => {
  try {
    const { hash } = req.params;
    
    const game = await gameService.getGameByHash(hash);
    
    if (!game) {
      return res.status(404).json({ error: 'Juego no encontrado' });
    }
    
    const updatedGame = await gameService.startGame(game.id);
    
    // Notificar a todos los jugadores que el juego ha comenzado
    broadcastToAll(hash, {
      type: 'GAME_STARTED',
      data: {
        game: updatedGame
      }
    });
    
    res.json({
      success: true,
      game: updatedGame
    });
  } catch (error) {
    console.error('Error iniciando juego:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/games/:hash/rounds
 * Crear una nueva ronda
 */
router.post('/games/:hash/rounds', verifyAdminToken, async (req, res) => {
  try {
    const { hash } = req.params;
    
    const game = await gameService.getGameByHash(hash);
    
    if (!game) {
      return res.status(404).json({ error: 'Juego no encontrado' });
    }
    
    const round = await gameService.createRound(game.id);
    
    // Notificar a todos sobre la nueva ronda
    broadcastToAll(hash, {
      type: 'NEW_ROUND',
      data: {
        round: {
          id: round.id,
          roundNumber: round.round_number,
          questionCount: round.questions.length
        }
      }
    });
    
    res.status(201).json({
      success: true,
      round
    });
  } catch (error) {
    console.error('Error creando ronda:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/rounds/:roundId/questions/:questionIndex
 * Enviar una pregunta a los jugadores
 */
router.post('/rounds/:roundId/questions/:questionIndex', verifyAdminToken, async (req, res) => {
  try {
    const { roundId, questionIndex } = req.params;
    
    // Obtener la ronda
    const roundResult = await query(
      'SELECT r.*, g.hash as game_hash FROM rounds r JOIN games g ON r.game_id = g.id WHERE r.id = $1',
      [roundId]
    );
    
    if (roundResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ronda no encontrada' });
    }
    
    const round = roundResult.rows[0];
    const gameHash = round.game_hash;
    const questionId = round.question_ids[questionIndex];
    
    console.log(`📤 Enviando pregunta ${questionIndex} al juego ${gameHash} (round: ${roundId})`);
    
    // Obtener la pregunta
    const question = await questionService.getQuestionById(questionId);
    
    if (!question) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    // Enviar pregunta a todos los jugadores
    broadcastToGame(gameHash, {
      type: 'QUESTION',
      data: {
        question,
        questionIndex: parseInt(questionIndex)
      }
    });
    
    // También enviar a admins
    broadcastToAdmins(gameHash, {
      type: 'QUESTION',
      data: {
        question,
        questionIndex: parseInt(questionIndex)
      }
    });
    
    // Iniciar countdown
    let countdown = 5;
    const interval = setInterval(() => {
      countdown--;
      broadcastToAll(gameHash, {
        type: 'COUNTDOWN',
        data: { seconds: countdown }
      });
      
      if (countdown <= 0) {
        clearInterval(interval);
        // Notificar fin de pregunta
        setTimeout(() => {
          broadcastToAll(gameHash, {
            type: 'QUESTION_END',
            data: { questionIndex: parseInt(questionIndex) }
          });
        }, 500);
      }
    }, 1000);
    
    res.json({
      success: true,
      question,
      questionIndex: parseInt(questionIndex)
    });
  } catch (error) {
    console.error('Error enviando pregunta:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/rounds/:roundId/end
 * Finalizar una ronda
 */
router.post('/rounds/:roundId/end', verifyAdminToken, async (req, res) => {
  try {
    const { roundId } = req.params;
    
    // Obtener la ronda y el hash del juego
    const roundResult = await query(
      'SELECT r.*, g.hash as game_hash FROM rounds r JOIN games g ON r.game_id = g.id WHERE r.id = $1',
      [roundId]
    );
    
    if (roundResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ronda no encontrada' });
    }
    
    const gameHash = roundResult.rows[0].game_hash;
    
    // Obtener ganadores
    const winners = await gameService.getRoundWinners(roundId);
    
    // Notificar fin de ronda
    broadcastToAll(gameHash, {
      type: 'ROUND_END',
      data: {
        winnersCount: winners.length
      }
    });
    
    res.json({
      success: true,
      winners
    });
  } catch (error) {
    console.error('Error finalizando ronda:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/rounds/:roundId/spin
 * Ejecutar la ruleta y asignar premio
 */
router.post('/rounds/:roundId/spin', verifyAdminToken, async (req, res) => {
  try {
    const { roundId } = req.params;
    
    // Obtener ganadores de la ronda
    const winners = await gameService.getRoundWinners(roundId);
    
    if (winners.length === 0) {
      return res.status(400).json({ error: 'No hay ganadores en esta ronda' });
    }
    
    // Obtener el hash del juego
    const roundResult = await query(
      'SELECT r.*, g.hash as game_hash FROM rounds r JOIN games g ON r.game_id = g.id WHERE r.id = $1',
      [roundId]
    );
    
    if (roundResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ronda no encontrada' });
    }
    
    const gameHash = roundResult.rows[0].game_hash;
    
    // Ejecutar ruleta
    const result = await gameService.spinRouletteAndAwardPrize(
      winners[0].game_id,
      roundId,
      winners
    );
    
    // Notificar al ganador (convertir ID a string para coincidir con WebSocket)
    sendToPlayer(String(result.winner.id), {
      type: 'YOU_WIN',
      data: {
        prize: result.prize
      }
    });
    
    // Notificar a todos sobre el ganador
    broadcastToAll(gameHash, {
      type: 'WINNER_ANNOUNCED',
      data: {
        winner: result.winner,
        prize: result.prize
      }
    });
    
    // Verificar si el juego debe terminar
    const shouldEnd = await gameService.shouldEndGame(winners[0].game_id);
    
    if (shouldEnd) {
      await gameService.finishGame(winners[0].game_id);
      
      // Notificar fin de juego
      broadcastToAll(gameHash, {
        type: 'GAME_FINISHED',
        data: {}
      });
    }
    
    res.json({
      success: true,
      result,
      shouldEndGame: shouldEnd
    });
  } catch (error) {
    console.error('Error ejecutando ruleta:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/rounds/:roundId/winners
 * Obtener ganadores de una ronda
 */
router.get('/rounds/:roundId/winners', verifyAdminToken, async (req, res) => {
  try {
    const { roundId } = req.params;
    
    const winners = await gameService.getRoundWinners(roundId);
    
    res.json({
      success: true,
      winners
    });
  } catch (error) {
    console.error('Error obteniendo ganadores:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/games/:hash/results
 * Obtener resultados finales del juego
 */
router.get('/games/:hash/results', verifyAdminToken, async (req, res) => {
  try {
    const { hash } = req.params;
    
    const game = await gameService.getGameByHash(hash);
    
    if (!game) {
      return res.status(404).json({ error: 'Juego no encontrado' });
    }
    
    const results = await gameService.getFinalResults(game.id);
    
    res.json({
      success: true,
      game,
      results
    });
  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/players/:playerId
 * Eliminar un jugador
 */
router.delete('/players/:playerId', verifyAdminToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    
    await gameService.removePlayer(playerId);
    
    res.json({
      success: true,
      message: 'Jugador eliminado'
    });
  } catch (error) {
    console.error('Error eliminando jugador:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/prizes
 * Obtener todos los premios
 */
router.get('/prizes', verifyAdminToken, async (req, res) => {
  try {
    const prizes = await prizeService.getAllPrizes();
    
    res.json({
      success: true,
      prizes
    });
  } catch (error) {
    console.error('Error obteniendo premios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/stats
 * Obtener estadísticas generales (preguntas y premios)
 */
router.get('/stats', verifyAdminToken, async (req, res) => {
  try {
    const prizeStats = await prizeService.getStats();
    const questionStats = await questionService.getStats();
    
    res.json({
      success: true,
      prizeStats,
      questionStats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

