const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../database/db');
const {
  generateAiQuiz,
  generateAiExercise,
  evaluateStudentExercise,
  generateQuizFeedback
} = require('../services/ai-quiz-exercise.service');

function getStudentId(req) {
  return req.headers['x-student-id'] || 'default-student';
}

async function getStudentContext(studentId) {
  try {
    const pool = getPool();
    const [studentRows] = await pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
    const student = studentRows[0] || null;

    const [learningProfileRows] = await pool.query('SELECT * FROM learning_profiles WHERE student_id = ?', [studentId]);
    const learningProfile = learningProfileRows[0] || null;

    const [diffRows] = await pool.query('SELECT difficulty FROM difficulties WHERE student_id = ?', [studentId]);
    const difficulties = diffRows.map(d => d.difficulty);

    const [diagRows] = await pool.query('SELECT * FROM diagnostic_results WHERE student_id = ? ORDER BY created_at DESC LIMIT 1', [studentId]);
    const diagnostic = diagRows[0] || null;

    return {
      student,
      difficulties,
      preferences: learningProfile?.learning_preferences ? JSON.parse(learningProfile.learning_preferences) : [],
      diagnostic: diagnostic ? {
        score: diagnostic.score,
        weaknesses: diagnostic.weaknesses ? JSON.parse(diagnostic.weaknesses) : [],
        strengths: diagnostic.strengths ? JSON.parse(diagnostic.strengths) : []
      } : null
    };
  } catch (err) {
    console.warn('[AI Context] Failed to fetch full student context:', err.message);
    return { student: null, difficulties: [], preferences: [], diagnostic: null };
  }
}

/**
 * Calculates adaptive difficulty based on MySQL student progress.
 */
async function resolveStudentId(pool, studentId) {
  try {
    if (studentId && studentId !== 'default-student') {
      const [rows] = await pool.query('SELECT id FROM students WHERE id = ?', [studentId]);
      if (rows.length > 0) return rows[0].id;
    }
    const [any] = await pool.query('SELECT id FROM students ORDER BY created_at DESC LIMIT 1');
    return any[0]?.id || null;
  } catch (_) {
    return null;
  }
}

/**
 * Calculates adaptive difficulty based on MySQL student progress.
 */
async function getSubjectAdaptiveDifficulty(pool, studentId, subjectName) {
  try {
    const validStudentId = await resolveStudentId(pool, studentId);
    let prog = null;
    if (validStudentId) {
      const [rows] = await pool.query(`
        SELECT p.*
        FROM progress p
        LEFT JOIN subjects s ON s.id = p.subject_id
        WHERE p.student_id = ? AND (s.name = ? OR p.topic = ?)
        ORDER BY p.updated_at DESC
        LIMIT 1
      `, [validStudentId, subjectName, subjectName]);
      prog = rows[0];
    }

    if (!prog) {
      return {
        difficulty: 'Débutant',
        levelIndex: 1,
        quizzesCompleted: 0,
        exercisesCompleted: 0,
        score: 0,
        mastery: 'beginner'
      };
    }

    const quizzes = prog.quizzes_completed || 0;
    const exercises = prog.exercises_completed || 0;
    const score = prog.score || 0;
    const totalActivities = quizzes + exercises;

    let difficulty = 'Débutant';
    let levelIndex = 1;

    if ((totalActivities >= 4 && score >= 70) || totalActivities >= 6) {
      difficulty = 'Avancé';
      levelIndex = 3;
    } else if ((totalActivities >= 2 && score >= 50) || totalActivities >= 2) {
      difficulty = 'Intermédiaire';
      levelIndex = 2;
    }

    return {
      difficulty,
      levelIndex,
      quizzesCompleted: quizzes,
      exercisesCompleted: exercises,
      score,
      mastery: prog.mastery_level || 'beginner'
    };
  } catch (err) {
    console.warn('[AdaptiveDifficulty] Error getting difficulty:', err.message);
    return { difficulty: 'Débutant', levelIndex: 1, quizzesCompleted: 0, exercisesCompleted: 0, score: 0 };
  }
}

/**
 * Updates or creates progress row for student and subject in MySQL.
 */
async function updateSubjectProgress(pool, studentId, subjectName, { quizCompleted, quizScore, exerciseCompleted, exerciseScore }) {
  let quizzes = 0;
  let exercises = 0;
  let currentScore = 0;
  let progId = uuidv4();
  let oldDifficulty = 'Débutant';

  try {
    const validStudentId = await resolveStudentId(pool, studentId);
    let progRows = [];
    let subjectId = null;

    if (validStudentId) {
      const [subjRows] = await pool.query('SELECT id FROM subjects WHERE name = ?', [subjectName]);
      subjectId = subjRows[0]?.id || null;

      const [pRows] = await pool.query(`
        SELECT * FROM progress
        WHERE student_id = ? AND (subject_id = ? OR topic = ?)
      `, [validStudentId, subjectId, subjectName]);
      progRows = pRows;
    }

    if (progRows.length > 0) {
      const p = progRows[0];
      progId = p.id;
      quizzes = p.quizzes_completed || 0;
      exercises = p.exercises_completed || 0;
      currentScore = p.score || 0;
      const totalOld = quizzes + exercises;
      if ((totalOld >= 4 && currentScore >= 70) || totalOld >= 6) oldDifficulty = 'Avancé';
      else if ((totalOld >= 2 && currentScore >= 50) || totalOld >= 2) oldDifficulty = 'Intermédiaire';
    }

    if (quizCompleted) quizzes += 1;
    if (exerciseCompleted) exercises += 1;

    if (quizScore !== undefined) {
      currentScore = currentScore === 0 ? quizScore : Math.round((currentScore * 0.4) + (quizScore * 0.6));
    }
    if (exerciseScore !== undefined) {
      currentScore = currentScore === 0 ? exerciseScore : Math.round((currentScore * 0.5) + (exerciseScore * 0.5));
    }

    const total = quizzes + exercises;
    let mastery = 'beginner';
    if (total >= 6 && currentScore >= 75) mastery = 'advanced';
    else if (total >= 2 && currentScore >= 50) mastery = 'intermediate';
    else if (total >= 1) mastery = 'developing';

    if (validStudentId) {
      if (progRows.length > 0) {
        await pool.query(`
          UPDATE progress
          SET quizzes_completed = ?, exercises_completed = ?, score = ?, mastery_level = ?, last_activity = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [quizzes, exercises, currentScore, mastery, progId]);
      } else {
        await pool.query(`
          INSERT INTO progress (id, student_id, subject_id, topic, score, mastery_level, exercises_completed, quizzes_completed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [progId, validStudentId, subjectId, subjectName, currentScore, mastery, exercises, quizzes]);
      }
    }
  } catch (err) {
    console.warn('[UpdateProgress] Error updating progress in DB:', err.message);
  }

  // Always compute and return adaptive progression
  if (quizCompleted && quizzes === 0) quizzes = 1;
  if (exerciseCompleted && exercises === 0) exercises = 1;
  const total = quizzes + exercises;
  if (currentScore === 0) currentScore = quizScore || exerciseScore || 75;

  let newDifficulty = 'Débutant';
  let levelIndex = 1;
  if ((total >= 4 && currentScore >= 70) || total >= 6) {
    newDifficulty = 'Avancé';
    levelIndex = 3;
  } else if ((total >= 2 && currentScore >= 50) || total >= 2) {
    newDifficulty = 'Intermédiaire';
    levelIndex = 2;
  }

  const leveledUp = newDifficulty !== oldDifficulty && levelIndex > (oldDifficulty === 'Intermédiaire' ? 2 : 1);

  return {
    quizzesCompleted: quizzes,
    exercisesCompleted: exercises,
    score: currentScore,
    adaptiveDifficulty: newDifficulty,
    levelIndex,
    leveledUp,
    message: leveledUp
      ? `Félicitations ! Grâce à tes réussites en ${subjectName}, le Tuteur IA élève le niveau au palier supérieur : ${newDifficulty} !`
      : undefined
  };
}

/**
 * GET /api/ai/adaptive-difficulty/:subject
 * Returns the current adaptive difficulty and mastery stats for a subject.
 */
router.get('/adaptive-difficulty/:subject', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const subject = req.params.subject;
    const pool = getPool();
    const diffInfo = await getSubjectAdaptiveDifficulty(pool, studentId, subject);
    res.json(diffInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/quiz/generate
 * Generates dynamic QCM questions tailored to the student's adaptive progress.
 */
router.post('/quiz/generate', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const context = await getStudentContext(studentId);
    const pool = getPool();
    const { subject, topic, level, count, avoidQuestions, difficulty } = req.body;

    const targetSubject = subject || 'Général';
    let targetDifficulty = difficulty;
    let adaptiveInfo = null;

    if (!targetDifficulty || targetDifficulty === 'auto') {
      adaptiveInfo = await getSubjectAdaptiveDifficulty(pool, studentId, targetSubject);
      targetDifficulty = adaptiveInfo.difficulty;
    }

    const result = await generateAiQuiz({
      subject: targetSubject,
      topic,
      level: level || context.student?.education_level,
      difficulty: targetDifficulty,
      count: count || 4,
      avoidQuestions: Array.isArray(avoidQuestions) ? avoidQuestions : []
    }, context);

    res.json({
      ...result,
      adaptiveDifficulty: targetDifficulty,
      levelIndex: targetDifficulty === 'Avancé' ? 3 : targetDifficulty === 'Intermédiaire' ? 2 : 1,
      stats: adaptiveInfo
    });
  } catch (error) {
    console.error('[API /api/ai/quiz/generate] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/quiz/feedback
 * Generates pedagogical feedback and records progress in MySQL for adaptive level increase.
 */
router.post('/quiz/feedback', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const context = await getStudentContext(studentId);
    const pool = getPool();
    const { subject, score, total, userAnswers } = req.body;

    const result = await generateQuizFeedback({
      subject,
      score,
      total,
      userAnswers
    }, context);

    const percent = total > 0 ? Math.round((score / total) * 100) : 0;
    const progressUpdate = await updateSubjectProgress(pool, studentId, subject || 'Général', {
      quizCompleted: true,
      quizScore: percent
    });

    res.json({
      ...result,
      updatedProgress: progressUpdate
    });
  } catch (error) {
    console.error('[API /api/ai/quiz/feedback] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/exercises/generate
 * Generates a full interactive exercise item with AI matching the adaptive level.
 */
router.post('/exercises/generate', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const context = await getStudentContext(studentId);
    const pool = getPool();
    const { subject, topic, difficulty, avoidIds } = req.body;

    const targetSubject = subject || 'Général';
    let targetDifficulty = difficulty;
    let adaptiveInfo = null;

    if (!targetDifficulty || targetDifficulty === 'auto') {
      adaptiveInfo = await getSubjectAdaptiveDifficulty(pool, studentId, targetSubject);
      targetDifficulty = adaptiveInfo.difficulty;
    }

    const result = await generateAiExercise({
      subject: targetSubject,
      topic,
      difficulty: targetDifficulty,
      avoidIds
    }, context);

    res.json({
      ...result,
      adaptiveDifficulty: targetDifficulty,
      levelIndex: targetDifficulty === 'Avancé' ? 3 : targetDifficulty === 'Intermédiaire' ? 2 : 1
    });
  } catch (error) {
    console.error('[API /api/ai/exercises/generate] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/exercises/evaluate
 * Evaluates the student's solution draft and updates progress for adaptive leveling.
 */
router.post('/exercises/evaluate', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const context = await getStudentContext(studentId);
    const pool = getPool();
    const { exercise, studentDraft } = req.body;

    if (!exercise) {
      return res.status(400).json({ error: 'Exercise details required.' });
    }

    const result = await evaluateStudentExercise({
      exercise,
      studentDraft
    }, context);

    let progressUpdate = null;
    if (result.score >= 60) {
      progressUpdate = await updateSubjectProgress(pool, studentId, exercise.subject || 'Général', {
        exerciseCompleted: true,
        exerciseScore: result.score
      });
    }

    res.json({
      ...result,
      updatedProgress: progressUpdate
    });
  } catch (error) {
    console.error('[API /api/ai/exercises/evaluate] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
