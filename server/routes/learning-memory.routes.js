const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../database/db');

function getStudentId(req) {
  return req.headers['x-student-id'] || 'default-student';
}

/**
 * GET /api/learning-memory
 * Retrieves real learning memory extracted from interactions in MySQL.
 */
router.get('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const pool = getPool();

    const [memories] = await pool.query(`
      SELECT m.*, s.name as subject_name
      FROM learning_memory m
      LEFT JOIN subjects s ON s.id = m.subject_id
      WHERE m.student_id = ?
      ORDER BY m.created_at DESC
    `, [studentId]);

    res.json(memories);
  } catch (error) {
    console.error('[API /api/learning-memory GET] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/learning-memory
 * Creates a new learning memory entry for the student in MySQL.
 */
router.post('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { subjectName, topic, memoryType, content, confidence } = req.body;

    if (!content || !memoryType) {
      return res.status(400).json({ error: 'Content and memoryType are required.' });
    }

    const pool = getPool();
    let subjectId = null;
    if (subjectName) {
      const [subjRows] = await pool.query('SELECT id FROM subjects WHERE name = ?', [subjectName]);
      if (subjRows.length > 0) subjectId = subjRows[0].id;
    }

    const id = uuidv4();
    await pool.query(`
      INSERT INTO learning_memory (id, student_id, subject_id, topic, memory_type, content, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, studentId, subjectId, topic || 'Général', memoryType, content, confidence || 'Moyen']);

    const [rows] = await pool.query('SELECT * FROM learning_memory WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('[API /api/learning-memory POST] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
