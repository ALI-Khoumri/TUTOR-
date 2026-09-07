const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../database/db');

function getStudentId(req) {
  return req.headers['x-student-id'] || 'default-student';
}

/**
 * GET /api/profile
 * Retrieves the full student profile from MySQL.
 */
router.get('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const pool = getPool();

    const [studentRows] = await pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
    const student = studentRows[0];

    if (!student || !student.onboarding_completed) {
      return res.json({
        id: studentId,
        firstName: student ? student.first_name : '',
        name: student ? student.first_name : '',
        age: student ? student.age : 0,
        educationLevel: student ? student.education_level : '',
        country: student ? student.country : '',
        language: student ? student.preferred_language : 'Français',
        fieldOfStudy: student ? student.field_of_study : '',
        school: student ? student.school : '',
        studyYear: student ? student.study_year : '',
        onboardingCompleted: false,
        subjects: [],
        objectives: [],
        difficulties: [],
        difficultyExplanation: '',
        learningStyles: [],
        studyTime: '',
        currentLevels: {},
        diagnosticResults: null,
        progress: null,
        weakTopics: [],
        strongTopics: []
      });
    }

    // 1. Get student subjects
    const [subjectRows] = await pool.query(`
      SELECT s.id, s.name, s.description
      FROM subjects s
      JOIN student_subjects ss ON ss.subject_id = s.id
      WHERE ss.student_id = ?
    `, [studentId]);

    // 2. Get learning profile
    const [learningProfileRows] = await pool.query('SELECT * FROM learning_profiles WHERE student_id = ?', [studentId]);
    const learningProfile = learningProfileRows[0];

    // 3. Get goals
    const [goalRows] = await pool.query('SELECT goal FROM student_goals WHERE student_id = ?', [studentId]);
    const goals = goalRows.map(g => g.goal);

    // 4. Get difficulties
    const [difficultyRows] = await pool.query('SELECT difficulty, context, difficulty_type FROM difficulties WHERE student_id = ?', [studentId]);
    const declaredDiffs = difficultyRows.filter(d => d.difficulty_type === 'declared').map(d => d.difficulty);
    const diffExplanation = difficultyRows.find(d => d.context)?.context || '';

    // 5. Get latest diagnostic
    const [diagRows] = await pool.query('SELECT * FROM diagnostic_results WHERE student_id = ? ORDER BY created_at DESC LIMIT 1', [studentId]);
    const diagnostic = diagRows[0];

    let diagnosticResults = null;
    let currentLevels = {};
    if (diagnostic) {
      diagnosticResults = {
        overallScore: diagnostic.score,
        subjectScores: {},
        strengths: diagnostic.strengths ? JSON.parse(diagnostic.strengths) : [],
        weaknesses: diagnostic.weaknesses ? JSON.parse(diagnostic.weaknesses) : [],
        recommendations: []
      };
      if (learningProfile && learningProfile.diagnostic_results) {
        try {
          const parsed = JSON.parse(learningProfile.diagnostic_results);
          if (parsed.subjectScores) diagnosticResults.subjectScores = parsed.subjectScores;
          if (parsed.recommendations) diagnosticResults.recommendations = parsed.recommendations;
        } catch (e) {}
      }
      Object.keys(diagnosticResults.subjectScores).forEach(subj => {
        currentLevels[subj] = diagnosticResults.subjectScores[subj] / 100;
      });
    }

    // 6. Progress stats
    const [progressRows] = await pool.query('SELECT * FROM progress WHERE student_id = ?', [studentId]);
    let exercisesCount = 0;
    let quizCount = 0;
    progressRows.forEach(p => {
      exercisesCount += p.exercises_completed || 0;
      quizCount += p.quizzes_completed || 0;
    });

    const parsedGoals = learningProfile?.goals ? JSON.parse(learningProfile.goals) : goals;
    const parsedStyles = learningProfile?.learning_preferences ? JSON.parse(learningProfile.learning_preferences) : [];

    const response = {
      id: student.id,
      firstName: student.first_name,
      name: student.first_name,
      lastName: student.last_name || '',
      age: student.age,
      ageGroup: student.age <= 12 ? '6-12' : student.age <= 16 ? '13-16' : student.age <= 20 ? '17-20' : student.age <= 30 ? '21-30' : '31+',
      educationLevel: student.education_level,
      country: student.country,
      language: student.preferred_language,
      field: student.field_of_study || '',
      branch: '',
      school: student.school || '',
      fieldOfStudy: student.field_of_study || '',
      studyYear: student.study_year || '',
      onboardingCompleted: Boolean(student.onboarding_completed),
      subjects: subjectRows.map(s => s.name),
      objectives: parsedGoals,
      difficulties: declaredDiffs,
      difficultyExplanation: diffExplanation,
      learningStyles: parsedStyles,
      studyTime: learningProfile?.study_time || '',
      currentLevels,
      diagnosticResults,
      progress: {
        globalProgress: diagnosticResults?.overallScore || 0,
        exercisesCompleted: exercisesCount,
        quizCompleted: quizCount,
        studyTimeTotal: '0h'
      },
      weakTopics: diagnosticResults?.weaknesses || [],
      strongTopics: diagnosticResults?.strengths || []
    };

    res.json(response);
  } catch (error) {
    console.error('[API /api/profile GET] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/onboarding/complete
 * Saves the onboarding flow in MySQL in a transaction.
 */
router.post(['/onboarding/complete', '/complete'], async (req, res) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const studentId = getStudentId(req);
    const {
      firstName, age, educationLevel, country, language,
      fieldOfStudy, school, studyYear,
      subjects, objectives, difficulties, difficultyExplanation,
      learningStyles, studyTime, diagnosticResults
    } = req.body;

    if (!firstName || !age || !educationLevel) {
      connection.release();
      return res.status(400).json({ error: 'First name, age, and education level are required.' });
    }

    await connection.beginTransaction();

    // 1. Insert or Update student
    await connection.query(`
      INSERT INTO students (
        id, first_name, age, country, preferred_language,
        education_level, school, field_of_study, study_year,
        onboarding_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        age = VALUES(age),
        country = VALUES(country),
        preferred_language = VALUES(preferred_language),
        education_level = VALUES(education_level),
        school = VALUES(school),
        field_of_study = VALUES(field_of_study),
        study_year = VALUES(study_year),
        onboarding_completed = 1
    `, [
      studentId, firstName.trim(), age, country || null, language || 'Français',
      educationLevel, school || null, fieldOfStudy || null, studyYear || null
    ]);

    // 2. Clear old relationships
    await connection.query('DELETE FROM student_subjects WHERE student_id = ?', [studentId]);
    await connection.query('DELETE FROM student_goals WHERE student_id = ?', [studentId]);
    await connection.query('DELETE FROM difficulties WHERE student_id = ?', [studentId]);
    await connection.query('DELETE FROM learning_profiles WHERE student_id = ?', [studentId]);

    // 3. Insert subjects and link them
    if (Array.isArray(subjects) && subjects.length > 0) {
      for (const subjName of subjects) {
        const subjectId = uuidv4();
        await connection.query(`
          INSERT INTO subjects (id, name, description)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name)
        `, [subjectId, subjName, `Matière ${subjName}`]);

        const [subjRows] = await connection.query('SELECT id FROM subjects WHERE name = ?', [subjName]);
        const actualId = subjRows[0]?.id || subjectId;

        await connection.query(`
          INSERT IGNORE INTO student_subjects (id, student_id, subject_id)
          VALUES (?, ?, ?)
        `, [uuidv4(), studentId, actualId]);
      }
    }

    // 4. Insert student goals
    if (Array.isArray(objectives)) {
      for (const g of objectives) {
        await connection.query(`
          INSERT INTO student_goals (id, student_id, goal)
          VALUES (?, ?, ?)
        `, [uuidv4(), studentId, g]);
      }
    }

    // 5. Insert difficulties
    if (Array.isArray(difficulties)) {
      for (const d of difficulties) {
        await connection.query(`
          INSERT INTO difficulties (id, student_id, difficulty_type, difficulty, context)
          VALUES (?, ?, 'declared', ?, ?)
        `, [uuidv4(), studentId, d, difficultyExplanation || null]);
      }
    }

    // 6. Insert Learning Profile
    await connection.query(`
      INSERT INTO learning_profiles (
        id, student_id, goals, difficulties, learning_preferences,
        study_time, diagnostic_status, diagnostic_results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      studentId,
      JSON.stringify(objectives || []),
      JSON.stringify(difficulties || []),
      JSON.stringify(learningStyles || []),
      studyTime || '',
      diagnosticResults ? 'completed' : 'not_started',
      diagnosticResults ? JSON.stringify(diagnosticResults) : null
    ]);

    // 7. Insert Diagnostic Results if present
    if (diagnosticResults) {
      const primarySubjectName = (subjects && subjects[0]) ? subjects[0] : null;
      let subjectId = null;
      if (primarySubjectName) {
        const [sRows] = await connection.query('SELECT id FROM subjects WHERE name = ?', [primarySubjectName]);
        if (sRows.length > 0) subjectId = sRows[0].id;
      }

      await connection.query(`
        INSERT INTO diagnostic_results (
          id, student_id, subject_id, topic, score, strengths, weaknesses, detected_prerequisites
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(),
        studentId,
        subjectId,
        primarySubjectName ? `Diagnostic ${primarySubjectName}` : 'Diagnostic initial',
        diagnosticResults.overallScore || 0,
        JSON.stringify(diagnosticResults.strengths || []),
        JSON.stringify(diagnosticResults.weaknesses || []),
        JSON.stringify([])
      ]);

      await connection.query(`
        INSERT INTO progress (
          id, student_id, subject_id, topic, score, mastery_level, exercises_completed, quizzes_completed
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0)
      `, [
        uuidv4(),
        studentId,
        subjectId,
        primarySubjectName || 'Général',
        diagnosticResults.overallScore || 0,
        diagnosticResults.overallScore >= 75 ? 'intermediate' : diagnosticResults.overallScore >= 50 ? 'developing' : 'beginner'
      ]);

      if (diagnosticResults.strengths?.length > 0) {
        await connection.query(`
          INSERT INTO learning_memory (id, student_id, subject_id, topic, memory_type, content, confidence)
          VALUES (?, ?, ?, ?, 'strong_topic', ?, 'Bon')
        `, [uuidv4(), studentId, subjectId, primarySubjectName || 'Général', `Points forts : ${diagnosticResults.strengths.join(', ')}`]);
      }

      if (diagnosticResults.weaknesses?.length > 0) {
        await connection.query(`
          INSERT INTO learning_memory (id, student_id, subject_id, topic, memory_type, content, confidence)
          VALUES (?, ?, ?, ?, 'weak_topic', ?, 'Faible')
        `, [uuidv4(), studentId, subjectId, primarySubjectName || 'Général', `À travailler : ${diagnosticResults.weaknesses.join(', ')}`]);
      }
    }

    await connection.commit();
    connection.release();

    console.log(`[API /api/onboarding/complete] Successfully saved profile for student ${studentId} in MySQL.`);
    res.json({ success: true, studentId, message: 'Onboarding completed and saved to MySQL.' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('[API /api/onboarding/complete] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/profile
 * Updates basic student profile fields in MySQL.
 */
router.put('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const pool = getPool();
    const { firstName, age, country, language, educationLevel, fieldOfStudy, school, studyYear } = req.body;

    await pool.query(`
      UPDATE students SET
        first_name = COALESCE(?, first_name),
        age = COALESCE(?, age),
        country = COALESCE(?, country),
        preferred_language = COALESCE(?, preferred_language),
        education_level = COALESCE(?, education_level),
        field_of_study = COALESCE(?, field_of_study),
        school = COALESCE(?, school),
        study_year = COALESCE(?, study_year)
      WHERE id = ?
    `, [firstName, age, country, language, educationLevel, fieldOfStudy, school, studyYear, studentId]);

    res.json({ success: true, message: 'Profile updated in MySQL.' });
  } catch (error) {
    console.error('[API /api/profile PUT] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/profile/reset
 * Resets student profile in MySQL.
 */
router.post('/reset', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const pool = getPool();
    await pool.query('DELETE FROM students WHERE id = ?', [studentId]);
    res.json({ success: true, message: 'Profile reset in MySQL.' });
  } catch (error) {
    console.error('[API /api/profile/reset] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
