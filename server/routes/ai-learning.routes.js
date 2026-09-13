const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../database/db');
const {
  isAuthorizedSchoolSubject,
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
    let validId = studentId;
    let [studentRows] = await pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
    let student = studentRows[0] || null;

    if (!student && studentId) {
      // Check if studentId is a user id
      const [uRows] = await pool.query('SELECT student_id FROM users WHERE id = ?', [studentId]);
      if (uRows.length > 0 && uRows[0].student_id) {
        validId = uRows[0].student_id;
        const [sRows] = await pool.query('SELECT * FROM students WHERE id = ?', [validId]);
        student = sRows[0] || null;
      }
    }

    if (!student) {
      // Fallback to active student with onboarding completed or latest created student
      const [any] = await pool.query('SELECT * FROM students ORDER BY onboarding_completed DESC, created_at DESC LIMIT 1');
      if (any.length > 0) {
        student = any[0];
        validId = student.id;
      }
    }

    const [learningProfileRows] = await pool.query('SELECT * FROM learning_profiles WHERE student_id = ?', [validId]);
    const learningProfile = learningProfileRows[0] || null;

    const [diffRows] = await pool.query('SELECT difficulty FROM difficulties WHERE student_id = ?', [validId]);
    const difficulties = diffRows.map(d => d.difficulty);

    const [diagRows] = await pool.query('SELECT * FROM diagnostic_results WHERE student_id = ? ORDER BY created_at DESC LIMIT 1', [validId]);
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

    const total = quizzes + exercises;
    currentScore = Math.min(100, (exercises * 15) + (quizzes * 20));

    let mastery = 'not_started';
    if (currentScore >= 80) mastery = 'mastered';
    else if (currentScore >= 60) mastery = 'advanced';
    else if (currentScore >= 40) mastery = 'intermediate';
    else if (currentScore > 0) mastery = 'developing';

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

    if (subject && !isAuthorizedSchoolSubject(subject)) {
      return res.status(400).json({
        error: `La matière "${subject}" n'est pas autorisée. La génération de quiz est strictement réservée aux matières officielles du Primaire et du Collège (Mathématiques, Français, Arabe, Éducation islamique, Anglais, Physique-Chimie, SVT/Éveil scientifique, Histoire-Géo, Informatique, EPS, Méthodologie).`
      });
    }

    const targetSubject = subject || 'Mathématiques';
    let targetDifficulty = difficulty;
    let adaptiveInfo = null;

    if (!targetDifficulty || targetDifficulty === 'auto') {
      adaptiveInfo = await getSubjectAdaptiveDifficulty(pool, studentId, targetSubject);
      targetDifficulty = adaptiveInfo.difficulty;
    }

    const result = await generateAiQuiz({
      subject: targetSubject,
      topic,
      level: level || context.student?.education_level || '1ère année primaire',
      difficulty: targetDifficulty,
      count: parseInt(count, 10) || 10,
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

    if (subject && !isAuthorizedSchoolSubject(subject)) {
      return res.status(400).json({
        error: `La matière "${subject}" n'est pas autorisée.`
      });
    }

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
    const { subject, topic, level, difficulty, avoidIds } = req.body;

    if (subject && !isAuthorizedSchoolSubject(subject)) {
      return res.status(400).json({
        error: `La matière "${subject}" n'est pas autorisée. La génération d'exercices est strictement réservée aux matières officielles du Primaire et du Collège (Mathématiques, Français, Arabe, Éducation islamique, Anglais, Physique-Chimie, SVT/Éveil scientifique, Histoire-Géo, Informatique, EPS, Méthodologie).`
      });
    }

    const targetSubject = subject || 'Mathématiques';
    const resolvedLevel = level || context.student?.education_level || '1ère année primaire';
    let targetDifficulty = difficulty;
    let adaptiveInfo = null;

    if (!targetDifficulty || targetDifficulty === 'auto') {
      adaptiveInfo = await getSubjectAdaptiveDifficulty(pool, studentId, targetSubject);
      targetDifficulty = adaptiveInfo.difficulty;
    }

    const result = await generateAiExercise({
      subject: targetSubject,
      topic,
      level: resolvedLevel,
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
    const { exercise, studentDraft, questionAnswers } = req.body;

    if (!exercise) {
      return res.status(400).json({ error: 'Exercise details required.' });
    }

    if (exercise.subject && !isAuthorizedSchoolSubject(exercise.subject)) {
      return res.status(400).json({
        error: `La matière "${exercise.subject}" n'est pas autorisée.`
      });
    }

    const result = await evaluateStudentExercise({
      exercise,
      studentDraft,
      questionAnswers
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

/**
 * GET /api/ai/courses/pdf/:subject
 * Streams a real, valid PDF course document for the requested subject.
 */
router.get('/courses/pdf/:subject', (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject || 'Mathématiques');
    if (!isAuthorizedSchoolSubject(subject)) {
      return res.status(400).send(`La matière "${subject}" n'est pas autorisée.`);
    }
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 45, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="cours-${encodeURIComponent(subject)}.pdf"`);

    doc.pipe(res);

    doc.rect(45, 45, 505, 80).fill('#1e3a8a');
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
       .text('TutorAI — Manuel & Polycopié de Cours', 60, 62);
    doc.fontSize(13).font('Helvetica')
       .text(`${subject} • Support Académique Officiel`, 60, 95);

    doc.moveDown(4);
    doc.fillColor('#2563eb').fontSize(16).font('Helvetica-Bold')
       .text(`Cours Complet : ${subject}`);
    doc.fillColor('#64748b').fontSize(10).font('Helvetica')
       .text('Document officiel certifié • TutorAI Learning System');
    doc.moveDown(1);

    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold')
       .text('1. Vue d\'ensemble et objectifs pédagogiques');
    doc.fillColor('#334155').fontSize(10).font('Helvetica')
       .text(`Ce guide et mémo scolaire de ${subject} présente les notions clés, les explications simples et les méthodes pas-à-pas pour réussir ses devoirs et progresser en confiance.`, { align: 'justify', lineGap: 3 });
    doc.moveDown(1);

    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold')
       .text('2. Points clés et notions fondamentales');
    doc.font('Helvetica').fontSize(10).fillColor('#334155')
       .text(`•  Maîtrise des définitions opératoires et du vocabulaire technique en ${subject}.`, { indent: 10 })
       .text(`•  Structure générale et principes directeurs de la discipline.`, { indent: 10 })
       .text(`•  Démarche déductive et application systématique aux cas pratiques d'examen.`, { indent: 10 });
    doc.moveDown(1);

    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold')
       .text('3. Règle méthodologique fondamentale');
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#1d4ed8')
       .text(`Toujours vérifier les prémisses et justifier chaque conclusion par un texte, une formule ou une démonstration validée.`, { indent: 10 });
    doc.moveDown(1);

    doc.fillColor('#b91c1c').fontSize(12).font('Helvetica-Bold')
       .text('4. Pièges d\'examen fréquents');
    doc.font('Helvetica').fontSize(10).fillColor('#991b1b')
       .text('!  Éviter la récitation par cœur sans analyse contextuelle.', { indent: 10 })
       .text('!  Soigner la rédaction et la justification de chaque étape du raisonnement.', { indent: 10 });

    doc.fontSize(8).fillColor('#94a3b8').text('Document édité par TutorAI — Conforme aux programmes officiels', 45, 800, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('[API /courses/pdf] Error:', err);
    res.status(500).send('Erreur lors de la génération du PDF.');
  }
});

module.exports = router;
