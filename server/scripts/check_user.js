const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'server/.env' });

async function check() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tutorai'
  });

  const [users] = await conn.query("SELECT id, email, first_name, student_id, created_at FROM users WHERE first_name LIKE '%Ali%' OR email LIKE '%ali%'");
  console.log('USERS MATCHING ALI:', JSON.stringify(users, null, 2));

  const [students] = await conn.query("SELECT * FROM students WHERE first_name LIKE '%Ali%'");
  console.log('STUDENTS MATCHING ALI:', JSON.stringify(students, null, 2));

  await conn.end();
}

check().catch(console.error);
