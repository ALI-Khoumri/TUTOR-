require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runMigrations } = require('./database/migrate');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-student-id']
}));
app.use(express.json());

// 2. API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/onboarding', require('./routes/profile.routes'));
app.use('/api', require('./routes/profile.routes'));
app.use('/api/subjects', require('./routes/subjects.routes'));
app.use('/api/conversations', require('./routes/conversations.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/learning-memory', require('./routes/learning-memory.routes'));
app.use('/api/diagnostic', require('./routes/diagnostic.routes'));
app.use('/api/ai', require('./routes/ai-learning.routes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'MySQL',
    timestamp: new Date().toISOString()
  });
});

// 3. Start Server with automatic MySQL migrations
async function startServer() {
  try {
    console.log('[Server] Connecting to MySQL and applying migrations...');
    await runMigrations();
    console.log('[Server] MySQL migrations completed successfully.');

    app.listen(PORT, () => {
      console.log(`[TutorAI Backend] Real MySQL server running on http://localhost:${PORT}`);
      console.log(`[TutorAI Backend] API Base: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('[Server] Failed to initialize MySQL server:', err.message);
    console.log('\n[Conseil de configuration MySQL]');
    console.log('Assurez-vous que votre serveur MySQL est démarré (ex: XAMPP, WampServer, Laragon ou MySQL Service).');
    console.log('Vous pouvez ajuster les identifiants MySQL dans le fichier server/.env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).');
    process.exit(1);
  }
}

startServer();
