import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import Logo from '../components/Logo';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [game, setGame] = useState(null);
  const [questionsPerRound, setQuestionsPerRound] = useState(3);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ prizes: 0, questions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.admin.getStats();
        if (response.success) {
          setStats({
            prizes: response.prizeStats?.total_units || 0,
            questions: response.questionStats?.total || 0
          });
        }
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
      }
    };
    fetchStats();
  }, []);

  const handleCreateGame = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.admin.createGame(questionsPerRound);
      
      if (response.success) {
        setGame(response.game);
      }
    } catch (err) {
      setError(err.message || 'Error al crear el juego');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = () => {
    if (game) {
      navigate(`/admin/game/${game.hash}`);
    }
  };

  const getJoinUrl = () => {
    const host = window.location.hostname === 'localhost' 
      ? '192.168.201.120' 
      : window.location.hostname;
    
    const port = window.location.port && window.location.port !== '80' && window.location.port !== '443'
      ? `:${window.location.port}`
      : '';
    
    const protocol = window.location.protocol;
    
    return `${protocol}//${host}${port}/join/${game?.hash}`;
  };

  return (
    <div className="admin-dashboard">
      {/* Header fijo */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <Logo size="large" className="logo-dashboard" />
          </div>
          <div className="header-right">
            <div className="status-badge">
              <span>●</span> Sistema Activo
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="dashboard-main">
        {!game ? (
          // Vista inicial - crear juego
          <>
            <div className="dashboard-grid">
              {/* Sección principal */}
              <div className="main-section">
                {/* Welcome card */}
                <div className="welcome-card">
                  <div className="welcome-content">
                    <h2>🎄 ¡Feliz Navidad! 🎄</h2>
                    <p>
                      Crea un nuevo juego navideño interactivo para tus participantes.
                      ¡Reparte alegría y regalos en estas fiestas! 🎁
                    </p>
                  </div>
                </div>

                {/* Configuración */}
                <div className="config-card">
                  <div className="config-header">
                    <h3>
                      <span>⚙️</span>
                      Configuración del Juego
                    </h3>
                  </div>
                  <div className="config-body">
                    <div className="config-option">
                      <label className="config-label">
                        Preguntas por ronda
                      </label>
                      <div className="number-selector">
                        <button
                          className="number-btn"
                          onClick={() => setQuestionsPerRound(Math.max(1, questionsPerRound - 1))}
                          disabled={questionsPerRound <= 1 || loading}
                          aria-label="Disminuir"
                        >
                          −
                        </button>
                        <div className="number-display">
                          {questionsPerRound}
                        </div>
                        <button
                          className="number-btn"
                          onClick={() => setQuestionsPerRound(Math.min(10, questionsPerRound + 1))}
                          disabled={questionsPerRound >= 10 || loading}
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--bg-danger)',
                        border: '2px solid #dc2626',
                        borderRadius: 'var(--border-radius)',
                        color: '#b91c1c',
                        fontWeight: 'var(--font-weight-medium)',
                        textAlign: 'center',
                        marginBottom: 'var(--spacing-md)'
                      }}>
                        <span style={{marginRight: '0.5rem'}}>⚠️</span> {error}
                      </div>
                    )}

                    <button
                      className="action-btn action-btn-primary create-button"
                      onClick={handleCreateGame}
                      disabled={loading}
                    >
                      <span className="action-btn-icon">{loading ? '⏳' : '🎄'}</span>
                      <span className="action-btn-text">{loading ? 'Creando...' : 'Crear Juego'}</span>
                      <span className="action-btn-shine"></span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="sidebar-section">
                {/* Stats */}
                <div className="stats-sidebar">
                  <div className="stats-header">
                    <span>📊</span> Estadísticas
                  </div>
                  <div className="stats-body">
                    <div className="stat-item">
                      <div className="stat-item-left">
                        <span className="stat-icon">🎁</span>
                        <span className="stat-label">Premios</span>
                      </div>
                      <span className="stat-value">{stats.prizes}</span>
                    </div>
                    <div className="stat-item">
                      <div className="stat-item-left">
                        <span className="stat-icon">❓</span>
                        <span className="stat-label">Preguntas</span>
                      </div>
                      <span className="stat-value">{stats.questions}</span>
                    </div>
                    <div className="stat-item">
                      <div className="stat-item-left">
                        <span className="stat-icon">👥</span>
                        <span className="stat-label">Jugadores</span>
                      </div>
                      <span className="stat-value">0</span>
                    </div>
                  </div>
                </div>

                {/* Info card */}
                <div className="info-card">
                  <div className="info-card-title">
                    <span>💡</span>
                    <span>Información</span>
                  </div>
                  <p className="info-card-text">
                    Una vez creado el juego, se generará un código QR que los participantes 
                    podrán escanear con sus móviles para unirse.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Vista cuando el juego está creado
          <div className="dashboard-grid">
            <div className="qr-section">
              <div className="qr-header">
                <h2>
                  <span>🎅</span>
                  ¡Ho Ho Ho! ¡Juego Listo!
                </h2>
              </div>
              
              <div className="qr-body">
                <div className="qr-left">
                  <div className="qr-code-container">
                    <QRCodeSVG
                      value={getJoinUrl()}
                      size={300}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="qr-code-label">
                    📱 Escanear con el móvil
                  </div>
                </div>

                <div className="qr-right">
                  <div className="game-code-display">
                    <div className="game-code-label">Código del Juego</div>
                    <div className="game-code-value">{game.hash}</div>
                  </div>

                  <div className="url-display">
                    {getJoinUrl()}
                  </div>

                  <div className="instructions">
                    <h4>
                      <span>📋</span>
                      Instrucciones para Participantes
                    </h4>
                    <ol>
                      <li>Escanea el código QR con la cámara de tu móvil</li>
                      <li>O accede directamente a la URL mostrada</li>
                      <li>Ingresa tu nombre para unirte al juego</li>
                      <li>Espera a que el administrador inicie el juego</li>
                    </ol>
                  </div>

                  <button
                    className="action-btn action-btn-secondary create-button"
                    onClick={handleStartGame}
                  >
                    <span className="action-btn-icon">🎅</span>
                    <span className="action-btn-text">Panel de Control</span>
                    <span className="action-btn-shine"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
