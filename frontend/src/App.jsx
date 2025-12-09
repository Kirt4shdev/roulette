import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './admin/AdminDashboard';
import AdminGame from './admin/AdminGame';
import PlayerJoin from './player/PlayerJoin';
import PlayerGame from './player/PlayerGame';

function App() {
  return (
    <Routes>
      {/* Rutas de Admin */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/game/:hash" element={<AdminGame />} />
      
      {/* Rutas de Jugador */}
      <Route path="/join/:hash" element={<PlayerJoin />} />
      <Route path="/play/:hash/:playerId" element={<PlayerGame />} />
      
      {/* Ruta por defecto */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;



