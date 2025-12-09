import { getClient } from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Premios corporativos navideños
const prizes = [
  { name: 'Cesta de Navidad', type: 'cesta', remaining_units: 1, priority: 1 },
  { name: 'Pack de Vino', type: 'vino', remaining_units: 1, priority: 2 },
  { name: 'Pack de Cava', type: 'cava', remaining_units: 30, priority: 3 }
];

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
    
    // Insertar premios
    for (const prize of prizes) {
      await client.query(
        'INSERT INTO prizes (name, type, initial_units, remaining_units, priority) VALUES ($1, $2, $3, $3, $4)',
        [prize.name, prize.type, prize.remaining_units, prize.priority]
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
      // Encontrar la respuesta correcta
      const correctAnswer = q.answers.find(a => a.correct);
      const answerIndex = q.answers.indexOf(correctAnswer);
      const correctOption = ['A', 'B', 'C', 'D'][answerIndex];
      
      await client.query(
        `INSERT INTO questions 
         (question_text, option_a, option_b, option_c, option_d, correct_option, used_in_game) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          q.question,
          q.answers[0].text,
          q.answers[1].text,
          q.answers[2].text,
          q.answers[3].text,
          correctOption,
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

