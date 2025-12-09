import { getClient } from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const client = await getClient();
  
  try {
    console.log('🔄 Ejecutando migraciones...');
    
    const sql = await fs.readFile(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );
    
    await client.query(sql);
    
    console.log('✅ Migraciones completadas exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();



