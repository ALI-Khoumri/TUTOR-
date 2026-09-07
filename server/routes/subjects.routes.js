const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../database/db');

function getStudentId(req) {
  return req.headers['x-student-id'] || 'default-student';
}

/**
 * GET /api/subjects
 * Retrieves all catalog subjects and marks those enrolled by the student in MySQL.
 */
router.get('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const pool = getPool();

    const [allSubjects] = await pool.query('SELECT * FROM subjects ORDER BY name ASC');
    const [studentSubjects] = await pool.query(`
      SELECT s.id, s.name, s.description
      FROM subjects s
      JOIN student_subjects ss ON ss.subject_id = s.id
      WHERE ss.student_id = ?
    `, [studentId]);

    res.json({
      catalog: allSubjects,
      enrolled: studentSubjects,
      enrolledSubjectNames: studentSubjects.map(s => s.name)
    });
  } catch (error) {
    console.error('[API /api/subjects GET] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subjects
 * Enrolls student in a subject by name in MySQL.
 */
router.post('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Subject name is required.' });

    const pool = getPool();

    let [subjRows] = await pool.query('SELECT id FROM subjects WHERE name = ?', [name]);
    let subjectId = subjRows[0]?.id;

    if (!subjectId) {
      subjectId = uuidv4();
      await pool.query('INSERT INTO subjects (id, name, description) VALUES (?, ?, ?)', [subjectId, name, description || '']);
    }

    await pool.query(`
      INSERT IGNORE INTO student_subjects (id, student_id, subject_id)
      VALUES (?, ?, ?)
    `, [uuidv4(), studentId, subjectId]);

    res.json({ success: true, message: `Subject ${name} enrolled.` });
  } catch (error) {
    console.error('[API /api/subjects POST] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
