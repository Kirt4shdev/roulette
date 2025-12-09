import { query } from '../db.js';

export const questionService = {
  /**
   * Obtener preguntas aleatorias no usadas
   */
  async getRandomQuestions(count) {
    const result = await query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
       FROM questions
       WHERE used_in_game = FALSE
       ORDER BY RANDOM()
       LIMIT $1`,
      [count]
    );
    return result.rows;
  },

  /**
   * Marcar preguntas como usadas
   */
  async markQuestionsAsUsed(questionIds) {
    await query(
      'UPDATE questions SET used_in_game = TRUE WHERE id = ANY($1)',
      [questionIds]
    );
  },

  /**
   * Resetear todas las preguntas
   */
  async resetAllQuestions() {
    await query('UPDATE questions SET used_in_game = FALSE');
    console.log('✅ Preguntas reseteadas');
  },

  /**
   * Obtener estadísticas de preguntas
   */
  async getStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE used_in_game = TRUE) as used,
        COUNT(*) FILTER (WHERE used_in_game = FALSE) as available
      FROM questions
    `);
    return result.rows[0];
  },

  /**
   * Validar respuesta
   */
  async validateAnswer(questionId, answer) {
    const result = await query(
      'SELECT correct_option FROM questions WHERE id = $1',
      [questionId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Pregunta no encontrada');
    }
    
    return result.rows[0].correct_option === answer.toUpperCase();
  },

  /**
   * Obtener pregunta por ID
   */
  async getQuestionById(questionId) {
    const result = await query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
       FROM questions
       WHERE id = $1`,
      [questionId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }
};

