import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCountdown } from '../hooks/useCountdown';
import api from '../services/api';
import Logo from '../components/Logo';
import Loader from '../components/Loader';
import './AdminGame.css';

const getWebSocketUrl = () => {
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl !== undefined && envWsUrl.trim() !== '') {
    return envWsUrl;
  }
  
  if (import.meta.env.MODE === 'development') {
    return 'ws://localhost:3000';
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}`;
};

const WS_URL = getWebSocketUrl();

function AdminGame() {
  const { hash } = useParams();
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [questionStats, setQuestionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState('waiting');
  const [currentRound, setCurrentRound] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [winners, setWinners] = useState([]);
  const [lastPrizeWinner, setLastPrizeWinner] = useState(null);

  const { seconds, start: startCountdown, stop: stopCountdown } = useCountdown(5, () => {
    handleQuestionTimeUp();
  });

  const handleWSMessage = useCallback((data) => {
    if (data.type === 'PLAYER_LIST_UPDATE' && data.players) {
      setPlayers(data.players);
    }
  }, []);

  const { isConnected } = useWebSocket(
    `${WS_URL}/ws?hash=${hash}&admin=true`,
    { onMessage: handleWSMessage }
  );

  const loadGameData = useCallback(async () => {
    try {
      const response = await api.admin.getGame(hash);
      if (response.success) {
        setGame(response.game);
        setPlayers(response.players);
        setPrizes(response.prizes);
        setQuestionStats(response.questionStats);
        
        if (response.game.status === 'finished') {
          setGameState('finished');
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, [hash]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  const handleStartGame = async () => {
    try {
      await api.admin.startGame(hash);
      setGameState('playing');
      setTimeout(() => handleCreateRound(), 2000);
    } catch (error) {
      console.error('Error iniciando juego:', error);
      alert('Error al iniciar el juego');
    }
  };

  const handleCreateRound = async () => {
    try {
      const response = await api.admin.createRound(hash);
      if (response.success) {
        setCurrentRound(response.round);
        setCurrentQuestionIndex(0);
        setWinners([]);
        setTimeout(() => handleShowQuestion(0, response.round), 2000);
      }
    } catch (error) {
      console.error('Error creando ronda:', error);
      alert(error.message || 'Error al crear ronda');
    }
  };

  const handleShowQuestion = async (index, round = currentRound) => {
    if (!round || !round.questions || index >= round.questions.length) return;

    setCurrentQuestionIndex(index);
    try {
      await api.admin.sendQuestion(round.id, index);
      startCountdown(5);
    } catch (error) {
      console.error('Error enviando pregunta:', error);
    }
  };

  const handleQuestionTimeUp = () => {
    stopCountdown();
    if (currentQuestionIndex < currentRound.questions.length - 1) {
      setTimeout(() => handleShowQuestion(currentQuestionIndex + 1), 2000);
    } else {
      setTimeout(() => handleEndRound(), 2000);
    }
  };

  const handleNextQuestion = () => {
    stopCountdown();
    if (currentQuestionIndex < currentRound.questions.length - 1) {
      handleShowQuestion(currentQuestionIndex + 1);
    } else {
      handleEndRound();
    }
  };

  const handleEndRound = async () => {
    setGameState('round_end');
    try {
      const response = await api.admin.endRound(currentRound.id);
      if (response.success) {
        setWinners(response.winners);
      }
    } catch (error) {
      console.error('Error finalizando ronda:', error);
    }
  };

  const handleSpinRoulette = async () => {
    if (winners.length === 0) {
      alert('No hay ganadores en esta ronda');
      return;
    }

    setGameState('spinning');
    setLastPrizeWinner(null);

    try {
      const response = await api.admin.spinRoulette(currentRound.id);
      
      if (response.success) {
        setTimeout(() => {
          setLastPrizeWinner(response.result);
          loadGameData();

          if (response.shouldEndGame) {
            setTimeout(() => handleFinishGame(), 3000);
          } else {
            // Mostrar el ganador y esperar a que admin pulse "Siguiente Ronda"
            setGameState('prize_awarded');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error ejecutando ruleta:', error);
      alert(error.message || 'Error al ejecutar ruleta');
      setGameState('round_end');
    }
  };

  const handleNextRound = () => {
    setGameState('playing');
    setLastPrizeWinner(null);
    handleCreateRound();
  };

  const handleFinishGame = () => {
    setGameState('finished');
  };

  if (loading) {
    return (
      <div className="admin-game">
        <Loader message="Cargando juego..." />
      </div>
    );
  }

  const activePlayers = players.filter(p => p.active);
  const availablePrizes = prizes.filter(p => p.remaining_units > 0);

  return (
    <div className="admin-game">
      {/* Header minimalista con logo */}
      <div className="admin-game-header">
        <div className="admin-game-header-content">
          <Logo size="medium" />
          <div className="header-status-indicators">
            <span className={`status-pill ${game?.status}`}>
              {game?.status === 'waiting' && 'En Espera'}
              {game?.status === 'running' && 'En Curso'}
              {game?.status === 'finished' && 'Finalizado'}
            </span>
            <span className={`ws-indicator ${isConnected ? 'connected' : ''}`} title={isConnected ? 'Conectado' : 'Desconectado'}></span>
          </div>
        </div>
      </div>

      {/* Layout principal con 3 columnas */}
      <div className="admin-game-layout">
        {/* Sidebar izquierda - Jugadores */}
        <div className="players-sidebar">
          <div className="sidebar-panel players-panel">
            <div className="panel-header players-header">
              <div className="panel-title">
                <span>👥</span> Jugadores
              </div>
              <div className="player-count-badge">{players.length}</div>
            </div>
            <div className="players-list-tall">
              {players.length === 0 ? (
                <div className="empty-list-message">
                  Esperando jugadores...
                </div>
              ) : (
                players.map((player, index) => (
                  <div key={player.id} className={`player-item-compact ${!player.active ? 'inactive' : ''}`}>
                    <span className="player-number">{index + 1}</span>
                    <span className="player-name-sidebar">{player.name}</span>
                    {player.prize_won && (
                      <span className="player-prize-tag">🎁</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Área central */}
        <div className="game-main-area">

          {/* Card principal del juego */}
          <div className="game-card-main">
            <div className="game-card-header">
              <h2 className="game-card-title">
                <span>🎅</span>
                {gameState === 'waiting' && 'Sala de Espera Navideña'}
                {gameState === 'playing' && 'Pregunta Navideña'}
                {gameState === 'round_end' && '¡Ganadores de la Ronda!'}
                {gameState === 'spinning' && 'Ruleta de Regalos'}
                {gameState === 'prize_awarded' && '🎁 ¡Premio Entregado!'}
                {gameState === 'finished' && '🎄 ¡Feliz Navidad! 🎄'}
              </h2>
            </div>

            <div className="game-card-body">
              {/* Estado: Esperando */}
              {gameState === 'waiting' && (
                <div className="waiting-screen">
                  <div className="waiting-icon">🎄</div>
                  <h2 className="waiting-title">Esperando Elfos... digo, Jugadores</h2>
                  <p className="waiting-text">
                    {players.length === 0 
                      ? '🎅 No hay participantes aún...'
                      : `🎁 ${players.length} participante${players.length !== 1 ? 's' : ''} listo${players.length !== 1 ? 's' : ''} para jugar`
                    }
                  </p>
                  {players.length > 0 && (
                    <div className="start-button-container">
                      <button className="action-btn action-btn-start" onClick={handleStartGame}>
                        <span className="action-btn-icon">🎅</span>
                        <span className="action-btn-text">¡Ho Ho Ho! Empezar</span>
                        <span className="action-btn-shine"></span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Estado: Mostrando pregunta */}
              {gameState === 'playing' && currentRound && currentRound.questions[currentQuestionIndex] && (
                <div className="question-display">
                  <div className="question-header-info">
                    <div className="round-indicator">
                      <span>📝</span>
                      Ronda {currentRound.round_number} - Pregunta {currentQuestionIndex + 1}/{currentRound.questions.length}
                    </div>
                    <div className="timer-circle">{seconds}</div>
                  </div>

                  <h3 className="question-text-large">
                    {currentRound.questions[currentQuestionIndex].question_text}
                  </h3>

                  <div className="answers-grid">
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <div
                        key={option}
                        className="answer-option"
                      >
                        <div className="answer-letter">{option}</div>
                        <div className="answer-text">
                          {currentRound.questions[currentQuestionIndex][`option_${option.toLowerCase()}`]}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="question-actions">
                    <button className="action-btn action-btn-forward" onClick={handleNextQuestion}>
                      <span className="action-btn-icon">➡️</span>
                      <span className="action-btn-text">Siguiente</span>
                      <span className="action-btn-shine"></span>
                    </button>
                  </div>
                </div>
              )}

              {/* Estado: Ganadores */}
              {gameState === 'round_end' && (
                <div className="winners-display">
                  <h2 className="winners-title">🎄 ¡Los Elegidos de Santa! 🎄</h2>
                  
                  {winners.length === 0 ? (
                    <div className="no-winners-message">
                      😔 No hubo ganadores en esta ronda
                    </div>
                  ) : (
                    <>
                      <div className="winners-grid">
                        {winners.map((winner) => (
                          <div key={winner.id} className="winner-card">
                            <span className="winner-icon-big">🏆</span>
                            <div className="winner-info">
                              <div className="winner-name">{winner.name}</div>
                              <div className="winner-score">
                                {winner.correct_answers}/{winner.total_answers} correctas
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="question-actions">
                        <button className="action-btn action-btn-roulette" onClick={handleSpinRoulette}>
                          <span className="action-btn-icon">🎰</span>
                          <span className="action-btn-text">Girar Ruleta</span>
                          <span className="action-btn-shine"></span>
                        </button>
                      </div>
                    </>
                  )}

                  {winners.length === 0 && (
                    <div className="question-actions">
                      <button className="action-btn action-btn-next" onClick={() => { setGameState('playing'); handleCreateRound(); }}>
                        <span className="action-btn-icon">➡️</span>
                        <span className="action-btn-text">Siguiente Ronda</span>
                        <span className="action-btn-shine"></span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Estado: Ruleta girando */}
              {gameState === 'spinning' && (
                <div className="roulette-screen">
                  <div className="roulette-spinner-big">🎰</div>
                  <h2 className="roulette-title-big">🎅 Santa está eligiendo... 🎁</h2>
                  <div className="roulette-names-list">
                    {winners.map((winner) => (
                      <span key={winner.id} className="roulette-name-tag">{winner.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado: Premio otorgado - esperando siguiente ronda */}
              {gameState === 'prize_awarded' && lastPrizeWinner && (
                <div className="winner-announcement">
                  <div className="winner-celebration-icon">🎉</div>
                  <h2 className="winner-announcement-name">¡{lastPrizeWinner.winner.name}!</h2>
                  <p className="prize-announcement">Ha ganado:</p>
                  <div className="prize-name-big">{lastPrizeWinner.prize.name}</div>
                  
                  <div className="question-actions" style={{ marginTop: '2rem' }}>
                    <button className="action-btn action-btn-next" onClick={handleNextRound}>
                      <span className="action-btn-icon">➡️</span>
                      <span className="action-btn-text">Siguiente Ronda</span>
                      <span className="action-btn-shine"></span>
                    </button>
                  </div>
                </div>
              )}

              {/* Estado: Finalizado */}
              {gameState === 'finished' && (
                <div className="game-finished-screen">
                  <div className="finished-icon-big">🏁</div>
                  <h2 className="finished-title-big">Juego Finalizado</h2>
                  <div className="final-results-table">
                    {players.map((player) => (
                      <div key={player.id} className="result-row">
                        <div className="result-player">{player.name}</div>
                        <div className="result-prize">
                          {player.prize_won ? `🎁 ${player.prize_won}` : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar derecha - Premios */}
        <div className="prizes-sidebar">
          <div className="sidebar-panel prizes-panel">
            <div className="panel-header prizes-header">
              <div className="panel-title">
                <span>🎁</span> Premios
              </div>
              <div className="prizes-count-badge">
                {availablePrizes.reduce((sum, p) => sum + p.remaining_units, 0)}
              </div>
            </div>
            <div className="prizes-list-tall">
              {prizes.map((prize) => (
                <div key={prize.id} className={`prize-item-compact ${prize.remaining_units === 0 ? 'depleted' : ''}`}>
                  <div className="prize-info">
                    <div className="prize-name-sidebar">{prize.name}</div>
                  </div>
                  <div className={`prize-units-badge ${prize.remaining_units === 0 ? 'depleted' : ''}`}>
                    {prize.remaining_units}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminGame;
