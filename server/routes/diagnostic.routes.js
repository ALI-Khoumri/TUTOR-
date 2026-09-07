const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../database/db');

function getStudentId(req) {
  return req.headers['x-student-id'] || 'default-student';
}

/**
 * GET /api/diagnostic
 * Retrieves diagnostic history for the student from MySQL.
 */
router.get('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const pool = getPool();

    const [results] = await pool.query(`
      SELECT d.*, s.name as subject_name
      FROM diagnostic_results d
      LEFT JOIN subjects s ON s.id = d.subject_id
      WHERE d.student_id = ?
      ORDER BY d.created_at DESC
    `, [studentId]);

    const formatted = results.map(r => ({
      ...r,
      strengths: r.strengths ? JSON.parse(r.strengths) : [],
      weaknesses: r.weaknesses ? JSON.parse(r.weaknesses) : [],
      detected_prerequisites: r.detected_prerequisites ? JSON.parse(r.detected_prerequisites) : []
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[API /api/diagnostic GET] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/diagnostic
 * Records a new diagnostic result in MySQL.
 */
router.post('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { subjectName, topic, score, strengths, weaknesses, detectedPrerequisites } = req.body;

    const pool = getPool();
    let subjectId = null;
    if (subjectName) {
      const [subjRows] = await pool.query('SELECT id FROM subjects WHERE name = ?', [subjectName]);
      if (subjRows.length > 0) subjectId = subjRows[0].id;
    }

    const id = uuidv4();

    await pool.query(`
      INSERT INTO diagnostic_results (id, student_id, subject_id, topic, score, strengths, weaknesses, detected_prerequisites)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, studentId, subjectId, topic || 'Diagnostic', score || 0,
      JSON.stringify(strengths || []), JSON.stringify(weaknesses || []),
      JSON.stringify(detectedPrerequisites || [])
    ]);

    const [rows] = await pool.query('SELECT * FROM diagnostic_results WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('[API /api/diagnostic POST] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
