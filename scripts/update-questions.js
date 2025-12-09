#!/usr/bin/env node

/**
 * Script para actualizar las preguntas del quiz
 * Uso: node scripts/update-questions.js
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const QUESTIONS_FILE = path.join(__dirname, '../questions/test_questions.json');
const BACKUP_DIR = path.join(__dirname, '../questions/backups');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateJSON() {
  log('\n🔍 Validando JSON...', 'blue');
  
  try {
    const content = fs.readFileSync(QUESTIONS_FILE, 'utf-8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('El JSON debe ser un array de preguntas');
    }
    
    // Validar cada pregunta
    data.forEach((q, index) => {
      if (!q.question || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct) {
        throw new Error(`Pregunta ${index + 1} incompleta`);
      }
      
      if (!['A', 'B', 'C', 'D'].includes(q.correct.toUpperCase())) {
        throw new Error(`Pregunta ${index + 1}: 'correct' debe ser A, B, C o D`);
      }
    });
    
    log(`✓ JSON válido con ${data.length} preguntas`, 'green');
    return true;
  } catch (error) {
    log(`✗ Error en el JSON: ${error.message}`, 'red');
    return false;
  }
}

function createBackup() {
  log('\n💾 Creando backup...', 'blue');
  
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(BACKUP_DIR, `questions-${timestamp}.json`);
    
    fs.copyFileSync(QUESTIONS_FILE, backupFile);
    log(`✓ Backup creado: ${path.basename(backupFile)}`, 'green');
    return true;
  } catch (error) {
    log(`✗ Error creando backup: ${error.message}`, 'red');
    return false;
  }
}

function updateDatabase() {
  log('\n🗄️  Actualizando base de datos...', 'blue');
  
  try {
    // Verificar si Docker está corriendo
    execSync('docker-compose ps', { stdio: 'pipe' });
    
    // Ejecutar seed
    log('Ejecutando seed...', 'yellow');
    const output = execSync('docker-compose exec -T backend npm run seed', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    log(output, 'yellow');
    log('✓ Base de datos actualizada', 'green');
    return true;
  } catch (error) {
    log(`✗ Error actualizando BD: ${error.message}`, 'red');
    log('\nAsegúrate de que Docker está corriendo:', 'yellow');
    log('  docker-compose up -d', 'yellow');
    return false;
  }
}

function showStats() {
  try {
    const content = fs.readFileSync(QUESTIONS_FILE, 'utf-8');
    const data = JSON.parse(content);
    
    log('\n📊 Estadísticas:', 'blue');
    log(`   Total de preguntas: ${data.length}`, 'green');
    
    // Contar por letra correcta
    const stats = { A: 0, B: 0, C: 0, D: 0 };
    data.forEach(q => {
      stats[q.correct.toUpperCase()]++;
    });
    
    log(`   Respuestas correctas por opción:`, 'green');
    Object.entries(stats).forEach(([letter, count]) => {
      const percentage = ((count / data.length) * 100).toFixed(1);
      log(`     ${letter}: ${count} (${percentage}%)`, 'green');
    });
  } catch (error) {
    log(`Error mostrando estadísticas: ${error.message}`, 'red');
  }
}

// Programa principal
async function main() {
  log('\n═══════════════════════════════════════════', 'blue');
  log('   🎮 Actualizar Preguntas del Quiz', 'blue');
  log('═══════════════════════════════════════════\n', 'blue');
  
  // 1. Validar JSON
  if (!validateJSON()) {
    log('\n❌ Corrige los errores en el JSON antes de continuar', 'red');
    process.exit(1);
  }
  
  // 2. Crear backup
  if (!createBackup()) {
    log('\n⚠️  Advertencia: No se pudo crear backup', 'yellow');
  }
  
  // 3. Mostrar estadísticas
  showStats();
  
  // 4. Actualizar base de datos
  if (!updateDatabase()) {
    log('\n❌ No se pudo actualizar la base de datos', 'red');
    process.exit(1);
  }
  
  log('\n✅ ¡Preguntas actualizadas exitosamente!', 'green');
  log('\nRecuerda refrescar el navegador para ver los cambios.\n', 'yellow');
}

main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
});

