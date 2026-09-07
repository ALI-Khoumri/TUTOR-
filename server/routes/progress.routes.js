const express = require('express');
const router = express.Router();
const { getPool } = require('../database/db');

function getStudentId(req) {
  return req.headers['x-student-id'] || 'default-student';
}

/**
 * GET /api/progress
 * Retrieves real progress calculated from MySQL.
 */
router.get('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const pool = getPool();

    const [progressList] = await pool.query(`
      SELECT p.*, s.name as subject_name
      FROM progress p
      LEFT JOIN subjects s ON s.id = p.subject_id
      WHERE p.student_id = ?
      ORDER BY p.updated_at DESC
    `, [studentId]);

    const [diagRows] = await pool.query('SELECT score FROM diagnostic_results WHERE student_id = ? ORDER BY created_at DESC LIMIT 1', [studentId]);
    const diagnostic = diagRows[0];

    let totalExercises = 0;
    let totalQuizzes = 0;
    progressList.forEach(p => {
      totalExercises += p.exercises_completed || 0;
      totalQuizzes += p.quizzes_completed || 0;
    });

    res.json({
      globalProgress: diagnostic ? diagnostic.score : 0,
      hasDiagnostic: Boolean(diagnostic),
      exercisesCompleted: totalExercises,
      quizzesCompleted: totalQuizzes,
      studyTimeTotal: '0h',
      items: progressList
    });
  } catch (error) {
    console.error('[API /api/progress GET] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
