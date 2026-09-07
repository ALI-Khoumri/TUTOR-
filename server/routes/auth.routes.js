'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../database/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tutorai_super_secret_jwt_key_2026_morocco';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * POST /api/auth/register
 * Body: { email, password, firstName }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName } = req.body;

    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Email, mot de passe et prenom sont requis.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caracteres.' });
    }

    const pool = getPool();

    // Check email uniqueness
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Un compte existe deja avec cet email.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user record (no student yet — linked after onboarding)
    const userId = uuidv4();
    await pool.query(
      'INSERT INTO users (id, email, first_name, password_hash, student_id) VALUES (?, ?, ?, ?, NULL)',
      [userId, email.toLowerCase().trim(), firstName.trim(), passwordHash]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email: email.toLowerCase().trim(), firstName: firstName.trim(), studentId: null },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      message: 'Compte cree avec succes.',
      token,
      user: { id: userId, email: email.toLowerCase().trim(), firstName: firstName.trim(), studentId: null }
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la creation du compte.' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis.' });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT u.*, COALESCE(s.first_name, u.first_name, "") AS effective_first_name FROM users u LEFT JOIN students s ON u.student_id = s.id WHERE u.email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    let studentId = user.student_id || null;
    let firstName = user.effective_first_name || '';

    // Auto-repair: if student_id is null but a student row with user.id exists, link them
    if (!studentId) {
      const [studentRows] = await pool.query(
        'SELECT id, first_name FROM students WHERE id = ? AND onboarding_completed = 1',
        [user.id]
      );
      if (studentRows.length > 0) {
        studentId = studentRows[0].id;
        firstName = studentRows[0].first_name || firstName;
        // Update the users table to persist the link
        await pool.query('UPDATE users SET student_id = ? WHERE id = ?', [studentId, user.id]);
        console.log(`[Auth] Auto-linked user ${user.email} to student ${studentId}`);
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, firstName, studentId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: 'Connexion reussie.',
      token,
      user: { id: user.id, email: user.email, firstName, studentId }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});


/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant.' });
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT u.id, u.email, u.student_id, COALESCE(s.first_name, u.first_name, "") AS first_name FROM users u LEFT JOIN students s ON u.student_id = s.id WHERE u.id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const user = rows[0];
    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name || '',
      studentId: user.student_id || null
    });
  } catch (err) {
    console.error('[Auth] Me error:', err);
    return res.status(401).json({ error: 'Token invalide.' });
  }
});

/**
 * POST /api/auth/link-student
 * Links a studentId to the authenticated user account.
 * Header: Authorization: Bearer <token>
 * Body: { studentId }
 */
router.post('/link-student', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant.' });
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ error: 'studentId requis.' });
    }

    const pool = getPool();
    await pool.query('UPDATE users SET student_id = ? WHERE id = ?', [studentId, decoded.id]);

    // Get student firstName
    const [students] = await pool.query('SELECT first_name FROM students WHERE id = ?', [studentId]);
    const firstName = students.length > 0 ? students[0].first_name : decoded.firstName || '';

    // Return a fresh token with updated studentId
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, firstName, studentId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ token: newToken, studentId, firstName });
  } catch (err) {
    console.error('[Auth] Link student error:', err);
    return res.status(500).json({ error: 'Erreur lors de la liaison du profil.' });
  }
});

module.exports = router;
