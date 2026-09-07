'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tutorai_super_secret_jwt_key_2026_morocco';

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifie. Veuillez vous connecter.' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expire. Veuillez vous reconnecter.' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
    } catch (_) {}
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
