import { getClient } from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para cargar premios desde JSON
async function loadPrizes() {
  let prizesPath = '/app/questions/prizes.json'; // Ruta en Docker
  
  try {
    await fs.access(prizesPath);
  } catch {
    // Si no existe, intentar ruta local (desarrollo)
    prizesPath = path.join(__dirname, '../../../questions/prizes.json');
  }
  
  try {
    const prizesData = await fs.readFile(prizesPath, 'utf-8');
    const prizes = JSON.parse(prizesData);
    console.log(`🎁 Cargados ${prizes.length} premios desde ${prizesPath}`);
    return prizes;
  } catch (error) {
    console.log('⚠️ No se encontró prizes.json, usando premios por defecto');
    // Premios por defecto si no existe el archivo
    return [
      { name: 'Cesta de Navidad', type: 'cesta', units: 17, priority: 1 },
      { name: 'Pack de Vino', type: 'vino', units: 20, priority: 2 },
      { name: 'Pack de Cava', type: 'cava', units: 20, priority: 3 }
    ];
  }
}

async function seed() {
  const client = await getClient();
  
  try {
    console.log('🌱 Iniciando seed de la base de datos...');
    
    // Limpiar datos existentes
    await client.query('DELETE FROM player_answers');
    await client.query('DELETE FROM rounds');
    await client.query('DELETE FROM players');
    await client.query('DELETE FROM games');
    await client.query('DELETE FROM prizes');
    await client.query('DELETE FROM questions');
    
    // Resetear secuencias
    await client.query('ALTER SEQUENCE questions_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE prizes_id_seq RESTART WITH 1');
    
    console.log('🧹 Datos existentes eliminados');
    
    // Cargar e insertar premios desde JSON
    const prizes = await loadPrizes();
    for (const prize of prizes) {
      await client.query(
        'INSERT INTO prizes (name, type, initial_units, remaining_units, priority) VALUES ($1, $2, $3, $3, $4)',
        [prize.name, prize.type, prize.units, prize.priority]
      );
    }
    console.log(`✅ Insertados ${prizes.length} premios`);
    
    // Cargar preguntas desde el JSON
    // Intentar múltiples rutas posibles
    let questionsPath = '/app/questions/test_questions.json'; // Ruta en Docker
    console.log('📋 Buscando preguntas en:', questionsPath);
    
    try {
      await fs.access(questionsPath);
    } catch {
      // Si no existe, intentar ruta local (desarrollo)
      questionsPath = path.join(__dirname, '../../../questions/test_questions.json');
      console.log('📋 Intentando ruta alternativa:', questionsPath);
    }
    
    const questionsData = await fs.readFile(questionsPath, 'utf-8');
    const questions = JSON.parse(questionsData);
    
    console.log(`📋 Cargando ${questions.length} preguntas...`);
    
    for (const q of questions) {
      // El nuevo formato ya tiene option_a, option_b, option_c, option_d y correct
      await client.query(
        `INSERT INTO questions 
         (question_text, option_a, option_b, option_c, option_d, correct_option, used_in_game) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          q.question,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.correct,
          false
        ]
      );
    }
    
    console.log(`✅ Insertadas ${questions.length} preguntas`);
    console.log('🎉 Seed completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();

