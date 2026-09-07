require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const { initDatabase, getPool } = require('./database/db');
const { runMigrations } = require('./database/migrate');

async function testMySQL() {
  console.log('=== Test de Connexion & Migration MySQL ===');
  console.log(`Tentative de connexion à MySQL sur ${process.env.DB_HOST}:${process.env.DB_PORT} (User: ${process.env.DB_USER}, DB: ${process.env.DB_NAME})...`);

  try {
    await runMigrations();
    const pool = getPool();

    const [tables] = await pool.query('SHOW TABLES;');
    console.log('\n[Succès] Tables créées dans MySQL :');
    console.log(tables.map(t => Object.values(t)[0]));

    // Check table count
    console.log(`\nNombre total de tables : ${tables.length}`);
    console.log('MySQL est configuré avec succès pour TutorAI !');
    process.exit(0);
  } catch (err) {
    console.error('\n[Erreur de connexion MySQL] :', err.message);
    console.log('\nAstuce :');
    console.log('- Vérifiez que votre serveur MySQL est bien allumé (via XAMPP, WAMP, Docker, ou service MySQL Windows).');
    console.log('- Vous pouvez modifier vos identifiants dans server/.env (DB_USER, DB_PASSWORD, DB_PORT, DB_NAME).');
    process.exit(1);
  }
}

testMySQL();
