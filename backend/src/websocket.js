import { WebSocketServer } from 'ws';
import { URL } from 'url';

// Store para mantener conexiones
const connections = new Map(); // gameHash -> Set<ws>
const playerConnections = new Map(); // playerId -> ws
const adminConnections = new Map(); // gameHash -> Set<ws>

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const gameHash = url.searchParams.get('hash');
    const playerId = url.searchParams.get('playerId');
    const isAdmin = url.searchParams.get('admin') === 'true';

    console.log(`🔌 Nueva conexión WebSocket: hash=${gameHash}, playerId=${playerId}, admin=${isAdmin}`);

    // Validar que tenga hash
    if (!gameHash) {
      ws.close(1008, 'Se requiere hash del juego');
      return;
    }

    // Registrar conexión
    if (isAdmin) {
      if (!adminConnections.has(gameHash)) {
        adminConnections.set(gameHash, new Set());
      }
      adminConnections.get(gameHash).add(ws);
      ws.gameHash = gameHash;
      ws.isAdmin = true;
      console.log(`👑 Admin conectado al juego ${gameHash}`);
    } else if (playerId) {
      if (!connections.has(gameHash)) {
        connections.set(gameHash, new Set());
      }
      connections.get(gameHash).add(ws);
      playerConnections.set(playerId, ws);
      ws.gameHash = gameHash;
      ws.playerId = playerId;
      console.log(`👤 Jugador ${playerId} conectado al juego ${gameHash}`);
    } else {
      ws.close(1008, 'Se requiere playerId o admin=true');
      return;
    }

    // Enviar confirmación de conexión
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      data: {
        gameHash,
        playerId,
        isAdmin
      }
    }));

    // Manejar mensajes entrantes
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📨 Mensaje recibido:', data);
        
        // El servidor puede recibir "pings" para mantener conexión
        if (data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
        }
      } catch (error) {
        console.error('Error procesando mensaje:', error);
      }
    });

    // Manejar desconexiones
    ws.on('close', () => {
      console.log(`🔌 Desconectado: hash=${gameHash}, playerId=${playerId}, admin=${isAdmin}`);
      
      if (ws.isAdmin && ws.gameHash) {
        const admins = adminConnections.get(ws.gameHash);
        if (admins) {
          admins.delete(ws);
          if (admins.size === 0) {
            adminConnections.delete(ws.gameHash);
          }
        }
      } else if (ws.playerId) {
        playerConnections.delete(ws.playerId);
        if (ws.gameHash) {
          const gameConns = connections.get(ws.gameHash);
          if (gameConns) {
            gameConns.delete(ws);
            if (gameConns.size === 0) {
              connections.delete(ws.gameHash);
            }
          }
        }
      }
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
    });
  });

  console.log('✅ Servidor WebSocket configurado');

  return wss;
}

/**
 * Enviar mensaje a todos los jugadores de un juego
 */
export function broadcastToGame(gameHash, message) {
  const gameConnections = connections.get(gameHash);
  
  console.log(`🔍 broadcastToGame - Hash: ${gameHash}, Conexiones encontradas:`, gameConnections ? gameConnections.size : 0);
  
  if (!gameConnections) {
    console.log(`⚠️ No hay conexiones para el juego ${gameHash}`);
    return;
  }

  const messageStr = JSON.stringify(message);
  let sent = 0;

  gameConnections.forEach((ws) => {
    console.log(`🔍 Verificando WS - readyState: ${ws.readyState}, gameHash: ${ws.gameHash}, playerId: ${ws.playerId}`);
    if (ws.readyState === 1) { // OPEN
      ws.send(messageStr);
      sent++;
    }
  });

  console.log(`📢 Broadcast a ${sent} jugadores del juego ${gameHash}:`, message.type);
}

/**
 * Enviar mensaje a un jugador específico
 */
export function sendToPlayer(playerId, message) {
  const ws = playerConnections.get(playerId);
  if (!ws || ws.readyState !== 1) {
    console.log(`⚠️ No se pudo enviar mensaje al jugador ${playerId}`);
    return false;
  }

  ws.send(JSON.stringify(message));
  console.log(`📤 Mensaje enviado al jugador ${playerId}:`, message.type);
  return true;
}

/**
 * Enviar mensaje a todos los admins de un juego
 */
export function broadcastToAdmins(gameHash, message) {
  const admins = adminConnections.get(gameHash);
  if (!admins) return;

  const messageStr = JSON.stringify(message);
  let sent = 0;

  admins.forEach((ws) => {
    if (ws.readyState === 1) { // OPEN
      ws.send(messageStr);
      sent++;
    }
  });

  console.log(`👑 Broadcast a ${sent} admins del juego ${gameHash}:`, message.type);
}

/**
 * Enviar mensaje a todos (jugadores y admins) de un juego
 */
export function broadcastToAll(gameHash, message) {
  broadcastToGame(gameHash, message);
  broadcastToAdmins(gameHash, message);
}

/**
 * Obtener estadísticas de conexiones
 */
export function getConnectionStats(gameHash) {
  return {
    players: connections.get(gameHash)?.size || 0,
    admins: adminConnections.get(gameHash)?.size || 0
  };
}

