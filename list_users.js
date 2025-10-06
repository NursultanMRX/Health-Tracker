const Database = require('better-sqlite3');
const db = new Database('diabetes.db');

const users = db.prepare('SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at DESC').all();

console.log('=== ALL USERS IN DATABASE ===\n');
users.forEach((u, i) => {
  console.log(`${i+1}. Email: ${u.email}`);
  console.log(`   Name: ${u.full_name}`);
  console.log(`   Role: ${u.role}`);
  console.log(`   Created: ${u.created_at}`);
  console.log('');
});

console.log(`Total users: ${users.length}`);
