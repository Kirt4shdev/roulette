import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import './PlayerJoin.css';

function PlayerJoin() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Por favor, ingresa tu nombre');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.game.joinGame(hash, name.trim());
      
      if (response.success) {
        navigate(`/play/${hash}/${response.player.id}`);
      }
    } catch (err) {
      setError(err.message || 'Error al unirse al juego');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="player-join">
      <div className="join-container">
        <div className="join-card">
          <div className="join-header">
            <div className="join-logo">
              <Logo size="large" />
            </div>
            <h1 className="join-title">🎄 ¡Feliz Navidad! 🎄</h1>
            <p className="join-subtitle">¡Participa en nuestro Quiz Navideño y gana premios!</p>
          </div>

          <div className="join-body">
            <div className="game-code-display-join">
              <div className="game-code-label-join">Código del Juego</div>
              <div className="game-code-value-join">{hash}</div>
            </div>

            <form onSubmit={handleJoin} className="join-form">
              <div className="form-group-join">
                <label className="form-label-join">
                  <span>👤</span> Tu Nombre
                </label>
                <input
                  type="text"
                  className="form-input-join"
                  placeholder="Ingresa tu nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
              </div>

              {error && (
                <div className="error-alert">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                className="action-btn action-btn-primary join-button"
                disabled={loading || !name.trim()}
              >
                <span className="action-btn-icon">{loading ? '⏳' : '🎄'}</span>
                <span className="action-btn-text">{loading ? 'Uniéndose...' : 'Unirse al Juego'}</span>
                <span className="action-btn-shine"></span>
              </button>
            </form>

            <div className="game-info-box">
              <div className="game-info-title">
                <span>🎅</span> ¿Cómo funciona?
              </div>
              <p className="game-info-text">
                1. 📝 Ingresa tu nombre<br/>
                2. ⏳ Espera que Santa inicie el juego<br/>
                3. ✅ Responde las preguntas correctamente<br/>
                4. 🎁 ¡Gana increíbles regalos navideños!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerJoin;
