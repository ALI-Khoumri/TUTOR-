const express = require('express');
const router = express.Router();
const { getPool } = require('../database/db');

const { v4: uuidv4 } = require('uuid');

function getStudentId(req) {
  return req.headers['x-student-id'] || 'default-student';
}

/**
 * GET /api/progress
 * Retrieves real progress calculated from practice (exercises, quizzes) in MySQL.
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
    let totalScoreSum = 0;

    progressList.forEach(p => {
      const ex = p.exercises_completed || 0;
      const qz = p.quizzes_completed || 0;
      totalExercises += ex;
      totalQuizzes += qz;

      let score = p.score !== null && p.score !== undefined ? p.score : 0;
      if (score === 0 && (ex > 0 || qz > 0)) {
        score = Math.min(100, (ex * 15) + (qz * 20));
      }
      p.score = score;
      totalScoreSum += score;
    });

    const globalProgress = progressList.length > 0
      ? Math.round(totalScoreSum / progressList.length)
      : 0;

    const totalMinutes = (totalExercises * 10) + (totalQuizzes * 5);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const studyTimeTotal = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    res.json({
      globalProgress,
      hasDiagnostic: Boolean(diagnostic),
      exercisesCompleted: totalExercises,
      quizzesCompleted: totalQuizzes,
      studyTimeTotal,
      items: progressList
    });
  } catch (error) {
    console.error('[API /api/progress GET] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/progress/exercise
 * Records when an exercise is completed or unchecked.
 */
router.post('/exercise', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const pool = getPool();
    const { subject, exerciseId, completed } = req.body;
    const targetSubject = subject || 'Général';

    let [subjRows] = await pool.query('SELECT id FROM subjects WHERE name = ?', [targetSubject]);
    let subjectId = subjRows[0]?.id || null;

    let [pRows] = await pool.query(`
      SELECT * FROM progress WHERE student_id = ? AND (subject_id = ? OR topic = ?)
    `, [studentId, subjectId, targetSubject]);

    let exercises = 0;
    let quizzes = 0;
    let progId = uuidv4();

    if (pRows.length > 0) {
      progId = pRows[0].id;
      exercises = pRows[0].exercises_completed || 0;
      quizzes = pRows[0].quizzes_completed || 0;
    }

    if (completed) {
      exercises += 1;
    } else if (exercises > 0) {
      exercises -= 1;
    }

    const newScore = Math.min(100, (exercises * 15) + (quizzes * 20));
    let mastery = 'not_started';
    if (newScore >= 80) mastery = 'mastered';
    else if (newScore >= 60) mastery = 'advanced';
    else if (newScore >= 40) mastery = 'intermediate';
    else if (newScore > 0) mastery = 'developing';

    if (pRows.length > 0) {
      await pool.query(`
        UPDATE progress
        SET exercises_completed = ?, score = ?, mastery_level = ?, last_activity = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [exercises, newScore, mastery, progId]);
    } else {
      await pool.query(`
        INSERT INTO progress (id, student_id, subject_id, topic, score, mastery_level, exercises_completed, quizzes_completed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [progId, studentId, subjectId, targetSubject, newScore, mastery, exercises, quizzes]);
    }

    res.json({
      success: true,
      subject: targetSubject,
      exercisesCompleted: exercises,
      quizzesCompleted: quizzes,
      score: newScore,
      masteryLevel: mastery
    });
  } catch (error) {
    console.error('[API /api/progress/exercise POST] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
