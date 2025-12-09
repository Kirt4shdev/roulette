import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { setupWebSocket } from './websocket.js';
import adminRoutes from './routes/admin.js';
import gameRoutes from './routes/game.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost', 'http://localhost:5173', 'http://localhost:80', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/admin', adminRoutes);
app.use('/api/game', gameRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Quiz Backend'
  });
});

// Ruta /ws para info (el WebSocket se maneja en websocket.js)
app.get('/ws', (req, res) => {
  res.json({
    message: 'WebSocket endpoint - use WebSocket protocol to connect',
    info: 'ws://host/ws?hash={gameHash}&playerId={playerId} or ws://host/ws?hash={gameHash}&admin=true'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: '🎮 Quiz Corporativo - Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      admin: '/api/admin/*',
      game: '/api/game/*',
      websocket: 'ws://localhost:' + PORT
    }
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Crear servidor HTTP
const server = createServer(app);

// Configurar WebSocket
setupWebSocket(server);

// Iniciar servidor
server.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   Servidor iniciado en puerto ${PORT}`);
  console.log(`   HTTP: http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('🚀 ========================================\n');
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

export default app;

