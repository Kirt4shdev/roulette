import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCountdown } from '../hooks/useCountdown';
import api from '../services/api';
import Logo from '../components/Logo';
import Loader from '../components/Loader';
import './PlayerGame.css';

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

function PlayerGame() {
  const { hash, playerId } = useParams();
  const [gameState, setGameState] = useState('loading');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [prize, setPrize] = useState(null);

  const hasAnsweredRef = useRef(hasAnswered);
  const currentQuestionRef = useRef(currentQuestion);

  useEffect(() => {
    hasAnsweredRef.current = hasAnswered;
    currentQuestionRef.current = currentQuestion;
  }, [hasAnswered, currentQuestion]);

  const { seconds, start: startCountdown, reset: resetCountdown } = useCountdown(5, () => {
    if (!hasAnsweredRef.current && currentQuestionRef.current) {
      handleTimeUp();
    }
  });

  const handleWSMessage = useCallback((data) => {
    switch (data.type) {
      case 'GAME_STARTED':
        setGameState('waiting');
        break;

      case 'NEW_ROUND':
        setPrize((currentPrize) => {
          if (currentPrize) return currentPrize;
          setCurrentRound(data.data?.round);
          setQuestionIndex(0);
          setSelectedAnswer(null);
          setHasAnswered(false);
          setGameState('waiting');
          return null;
        });
        break;

      case 'QUESTION':
        setPrize((currentPrize) => {
          if (currentPrize) return currentPrize;
          setCurrentQuestion(data.data?.question);
          setSelectedAnswer(null);
          setHasAnswered(false);
          setQuestionIndex(data.data?.questionIndex || 0);
          setGameState('question');
          startCountdown(5);
          return null;
        });
        break;

      case 'ROUND_END':
        setPrize((currentPrize) => {
          if (!currentPrize) {
            setSelectedAnswer(null);
            setHasAnswered(false);
            setGameState('round_end');
            resetCountdown();
          }
          return currentPrize;
        });
        break;

      case 'YOU_WIN':
        setPrize(data.data?.prize);
        setGameState('prize');
        break;

      case 'GAME_FINISHED':
        setGameState('finished');
        break;

      default:
        break;
    }
  }, [startCountdown, resetCountdown]);

  const { isConnected } = useWebSocket(
    `${WS_URL}/ws?hash=${hash}&playerId=${playerId}`,
    { onMessage: handleWSMessage }
  );

  useEffect(() => {
    const init = async () => {
      try {
        const playerResponse = await api.game.getPlayer(playerId);
        if (playerResponse.success && playerResponse.player.prizeWon) {
          setPrize({ name: playerResponse.player.prizeWon });
          setGameState('prize');
          return;
        }
        
        const response = await api.game.getGame(hash);
        if (response.success) {
          if (response.game.status === 'waiting') {
            setGameState('waiting');
          } else if (response.game.status === 'finished') {
            setGameState('finished');
          } else if (response.game.status === 'running') {
            setGameState('waiting');
          }
        }
      } catch (error) {
        console.error('Error al cargar juego:', error);
      }
    };

    init();
  }, [hash, playerId]);

  const handleAnswerSelect = async (answer) => {
    if (hasAnswered || !currentQuestion) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);
    resetCountdown();

    try {
      await api.game.answerQuestion(playerId, currentRound.id, currentQuestion.id, answer);
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
    }
  };

  const handleTimeUp = () => {
    if (!hasAnswered) {
      setHasAnswered(true);
    }
  };

  return (
    <div className="player-game">
      {/* Header */}
      <div className="player-header">
        <Logo size="small" />
        <div className="connection-badge">
          <span className={`connection-dot ${isConnected ? 'connected' : ''}`}></span>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="player-container">
        <div className="player-card-main">
          {gameState === 'loading' && (
            <div className="player-state-container">
              <Loader message="Cargando..." />
            </div>
          )}

          {gameState === 'waiting' && (
            <div className="player-state-container">
              <div className="waiting-state">
                <div className="waiting-icon-big">🎄</div>
                <h2 className="waiting-title">¡Esperando a Santa!</h2>
                <p className="waiting-message">El juego navideño comenzará pronto... 🎅</p>
              </div>
            </div>
          )}

          {gameState === 'question' && currentQuestion && (
            <div className="question-container">
              <div className="question-header-player">
                <div className="question-number-badge">
                  Pregunta {questionIndex + 1}
                </div>
                <div className="timer-badge">{seconds}</div>
              </div>

              <h3 className="question-text-player">{currentQuestion.question_text}</h3>

              <div className="answers-grid-player">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <button
                    key={option}
                    className={`answer-btn-player ${selectedAnswer === option ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={hasAnswered}
                  >
                    <div className="answer-letter-player">{option}</div>
                    <div className="answer-text-player">
                      {currentQuestion[`option_${option.toLowerCase()}`]}
                    </div>
                  </button>
                ))}
              </div>

              {hasAnswered && (
                <div className="answered-feedback">
                  ✅ Respuesta enviada. Esperando resultados...
                </div>
              )}
            </div>
          )}

          {gameState === 'round_end' && (
            <div className="player-state-container">
              <div className="waiting-state">
                <div className="waiting-icon-big">🎁</div>
                <h2 className="waiting-title">¡Ronda Completada!</h2>
                <p className="waiting-message">🎅 Santa está eligiendo al ganador... 🎄</p>
              </div>
            </div>
          )}

          {gameState === 'prize' && prize && (
            <div className="prize-screen">
              <div className="prize-icon-big">🎉</div>
              <h1 className="prize-title-big">🎄 ¡Feliz Navidad! 🎄</h1>
              <p className="prize-subtitle">🎅 Santa te ha elegido para recibir:</p>
              <div className="prize-display-big">{prize.name}</div>
              <p className="prize-message">
                🎁 Recoge tu regalo navideño al finalizar el evento 🎁
              </p>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="player-state-container">
              <div className="finished-screen">
                <div className="finished-icon-player">🏁</div>
                <h2 className="finished-title-player">🎄 ¡Feliz Navidad! 🎄</h2>
                <p className="finished-message">
                  ¡Gracias por participar en nuestro Quiz Navideño! 🎅🎁
                </p>
                {prize && (
                  <div className="final-prize-display">
                    <div className="final-prize-label">Tu premio:</div>
                    <div className="final-prize-value">{prize.name}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerGame;
