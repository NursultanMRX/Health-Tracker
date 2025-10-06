const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const db = new Database('diabetes.db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Password Reset Tool ===\n');

rl.question('Enter email address: ', (email) => {
  rl.question('Enter new password: ', (password) => {

    // Check if user exists
    const user = db.prepare('SELECT id, email FROM profiles WHERE email = ?').get(email);

    if (!user) {
      console.log(`\n❌ User with email "${email}" not found!`);
      console.log('\nAvailable users:');
      const users = db.prepare('SELECT email FROM profiles').all();
      users.forEach(u => console.log(`  - ${u.email}`));
    } else {
      // Update password
      const passwordHash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE profiles SET password_hash = ? WHERE email = ?').run(passwordHash, email);
      console.log(`\n✅ Password updated for ${email}`);
      console.log(`New credentials: ${email} / ${password}`);
    }

    rl.close();
  });
});
