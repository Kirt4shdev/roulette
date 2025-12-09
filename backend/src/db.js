import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Probar la conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
  process.exit(-1);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (!process.env.DISABLE_QUERY_LOG) {
      console.log('Ejecutada query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    if (!process.env.DISABLE_QUERY_LOG) {
      console.error('Error en query:', { text, error: error.message });
    }
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Configurar timeout
  const timeout = setTimeout(() => {
    console.error('Un cliente ha estado fuera del pool más de 5 segundos');
  }, 5000);
  
  client.query = (...args) => {
    return query(...args);
  };
  
  client.release = () => {
    clearTimeout(timeout);
    return release();
  };
  
  return client;
};

export default { query, getClient };


