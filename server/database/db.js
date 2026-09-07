require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
const DB_NAME = process.env.DB_NAME || 'tutorai';

let pool = null;

/**
 * Ensures that the MySQL database exists before initializing the pool.
 */
async function initDatabase() {
  try {
    // 1. Initial connection without database to ensure DB_NAME exists
    const rootConnection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConnection.end();

    // 2. Create the main application pool
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });

    console.log(`[MySQL] Connected to database '${DB_NAME}' on ${DB_HOST}:${DB_PORT} as '${DB_USER}'.`);
    return pool;
  } catch (err) {
    console.error(`[MySQL Connection Error] Could not connect to MySQL at ${DB_HOST}:${DB_PORT}:`, err.message);
    throw err;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('[MySQL] Pool has not been initialized yet. Call initDatabase() first.');
  }
  return pool;
}

module.exports = {
  initDatabase,
  getPool,
  DB_CONFIG: { host: DB_HOST, port: DB_PORT, user: DB_USER, database: DB_NAME }
};
