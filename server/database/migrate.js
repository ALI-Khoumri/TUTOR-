require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { initDatabase, getPool, DB_CONFIG } = require('./db');

async function runMigrations() {
  console.log(`[MySQL Database] Initializing migrations on database '${DB_CONFIG.database}'...`);
  const pool = await initDatabase();

  // 1. Ensure migrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) continue;

    const version = parseInt(match[1], 10);
    const name = match[2];

    const [rows] = await pool.query('SELECT version FROM schema_migrations WHERE version = ?', [version]);

    if (rows.length === 0) {
      console.log(`[MySQL] Applying migration ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Execute SQL (multiple statements supported)
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [version, name]);
      console.log(`[MySQL] Migration ${file} successfully applied.`);
    } else {
      console.log(`[MySQL] Migration ${file} already applied.`);
    }
  }

  console.log('[MySQL] All migrations are up to date.');
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[MySQL Migration Error]:', err);
      process.exit(1);
    });
}

module.exports = {
  runMigrations
};
