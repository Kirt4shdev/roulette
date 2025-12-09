import { query } from '../db.js';

export const prizeService = {
  /**
   * Obtener todos los premios disponibles ordenados por prioridad
   */
  async getAvailablePrizes() {
    const result = await query(
      `SELECT id, name, type, remaining_units, priority
       FROM prizes
       WHERE remaining_units > 0
       ORDER BY priority ASC`
    );
    return result.rows;
  },

  /**
   * Obtener el mejor premio disponible (menor prioridad)
   */
  async getBestAvailablePrize() {
    const result = await query(
      `SELECT id, name, type, remaining_units, priority
       FROM prizes
       WHERE remaining_units > 0
       ORDER BY priority ASC
       LIMIT 1`
    );
    return result.rows[0] || null;
  },

  /**
   * Asignar un premio (reducir unidades disponibles)
   */
  async awardPrize(prizeId) {
    const result = await query(
      `UPDATE prizes 
       SET remaining_units = remaining_units - 1
       WHERE id = $1 AND remaining_units > 0
       RETURNING id, name, type, remaining_units, priority`,
      [prizeId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Premio no disponible');
    }
    
    return result.rows[0];
  },

  /**
   * Obtener todos los premios (incluyendo agotados)
   */
  async getAllPrizes() {
    const result = await query(
      'SELECT id, name, type, remaining_units, priority FROM prizes ORDER BY priority ASC'
    );
    return result.rows;
  },

  /**
   * Verificar si quedan premios disponibles
   */
  async hasAvailablePrizes() {
    const result = await query(
      'SELECT EXISTS(SELECT 1 FROM prizes WHERE remaining_units > 0) as has_prizes'
    );
    return result.rows[0].has_prizes;
  },

  /**
   * Obtener estadísticas de premios
   */
  async getStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_types,
        SUM(remaining_units) as total_units,
        COUNT(*) FILTER (WHERE remaining_units > 0) as available_types
      FROM prizes
    `);
    return result.rows[0];
  },

  /**
   * Resetear premios a sus valores originales del seed
   */
  async resetPrizes() {
    await query('UPDATE prizes SET remaining_units = initial_units');
    console.log('✅ Premios reseteados a valores originales del seed');
  }
};

