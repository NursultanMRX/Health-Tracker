import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'diabetes.db'));

// Check if age column exists
const columns = db.prepare(`PRAGMA table_info(profiles)`).all();
const hasAgeColumn = columns.some(col => col.name === 'age');

if (!hasAgeColumn) {
  console.log('Adding age column to profiles table...');
  db.prepare(`ALTER TABLE profiles ADD COLUMN age INTEGER`).run();
  console.log('✓ Age column added successfully');
} else {
  console.log('✓ Age column already exists');
}

db.close();
