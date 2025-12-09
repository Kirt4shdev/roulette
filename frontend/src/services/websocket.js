// Función auxiliar para el frontend admin
// Importar en AdminGame.jsx si es necesario

export function broadcastToAll(gameHash, message) {
  // Esta función se llama desde el backend
  // El frontend admin solo envía mensajes a través del WebSocket
  console.log('Broadcasting message:', message);
}



