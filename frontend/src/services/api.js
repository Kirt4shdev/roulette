// En producción (Docker), usar rutas relativas para que Nginx haga el proxy
// En desarrollo, usar localhost:3000 directamente
const isDevelopment = import.meta.env.MODE === 'development';
const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (envApiUrl !== undefined && envApiUrl.trim() !== '') 
  ? envApiUrl 
  : (isDevelopment ? 'http://localhost:3000' : '');
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'admin_secret_token_change_in_production';

console.log('🔧 API Configuration:', { 
  mode: import.meta.env.MODE, 
  API_URL: API_URL || '(relative paths)', 
  isDevelopment,
  envApiUrl: envApiUrl
});

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

function adminRequest(endpoint, options = {}) {
  return request(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  });
}

export const api = {
  // Admin endpoints
  admin: {
    createGame: (questionsPerRound = 3) =>
      adminRequest('/api/admin/games', {
        method: 'POST',
        body: JSON.stringify({ questionsPerRound })
      }),

    getGame: (hash) =>
      adminRequest(`/api/admin/games/${hash}`),

    startGame: (hash) =>
      adminRequest(`/api/admin/games/${hash}/start`, {
        method: 'POST'
      }),

    createRound: (hash) =>
      adminRequest(`/api/admin/games/${hash}/rounds`, {
        method: 'POST'
      }),

    sendQuestion: (roundId, questionIndex) =>
      adminRequest(`/api/admin/rounds/${roundId}/questions/${questionIndex}`, {
        method: 'POST'
      }),

    endRound: (roundId) =>
      adminRequest(`/api/admin/rounds/${roundId}/end`, {
        method: 'POST'
      }),

    spinRoulette: (roundId) =>
      adminRequest(`/api/admin/rounds/${roundId}/spin`, {
        method: 'POST'
      }),

    getRoundWinners: (roundId) =>
      adminRequest(`/api/admin/rounds/${roundId}/winners`),

    getResults: (hash) =>
      adminRequest(`/api/admin/games/${hash}/results`),

    removePlayer: (playerId) =>
      adminRequest(`/api/admin/players/${playerId}`, {
        method: 'DELETE'
      }),

    getPrizes: () =>
      adminRequest('/api/admin/prizes')
  },

  // Game endpoints (públicos)
  game: {
    getGame: (hash) =>
      request(`/api/game/${hash}`),

    getPlayer: (playerId) =>
      request(`/api/game/player/${playerId}`),

    joinGame: (hash, name) =>
      request(`/api/game/${hash}/join`, {
        method: 'POST',
        body: JSON.stringify({ name })
      }),

    answerQuestion: (playerId, roundId, questionId, answer) =>
      request('/api/game/answer', {
        method: 'POST',
        body: JSON.stringify({ playerId, roundId, questionId, answer })
      })
  }
};

export default api;

