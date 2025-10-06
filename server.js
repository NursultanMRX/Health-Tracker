import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cron from 'node-cron';
import * as notificationService from './notificationService.js';
import * as exportService from './exportService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CORS_ORIGIN, 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179'],
  credentials: true
}));
app.use(express.json());

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'diabetes.db'), { readonly: false, fileMustExist: false });
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize schema
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('patient', 'doctor')),
      date_of_birth TEXT,
      sex TEXT CHECK (sex IN ('male', 'female')),
      clinic_location TEXT,
      primary_care_physician_id TEXT REFERENCES profiles(id),
      is_profile_complete INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patient_settings (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
      glucose_unit TEXT NOT NULL DEFAULT 'mg/dL' CHECK (glucose_unit IN ('mg/dL', 'mmol/L')),
      target_low INTEGER NOT NULL DEFAULT 70,
      target_high INTEGER NOT NULL DEFAULT 180,
      large_text_enabled INTEGER DEFAULT 1,
      high_contrast_enabled INTEGER DEFAULT 0,
      voice_guidance_enabled INTEGER DEFAULT 0,
      data_sharing_enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS glucose_readings (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      value_mg_dl INTEGER NOT NULL,
      measurement_type TEXT,
      tags TEXT DEFAULT '[]',
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      meal_name TEXT NOT NULL,
      carbs_g INTEGER DEFAULT 0,
      protein_g INTEGER DEFAULT 0,
      fat_g INTEGER DEFAULT 0,
      portion_size TEXT,
      photo_url TEXT,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      medication_name TEXT NOT NULL,
      dose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'taken',
      missed_reason TEXT,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      activity_type TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      intensity TEXT NOT NULL DEFAULT 'low',
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feelings (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 5),
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clinical_alerts (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      message TEXT NOT NULL,
      suggested_action TEXT,
      detected_at TEXT DEFAULT (datetime('now')),
      acknowledged_at TEXT,
      acknowledged_by TEXT REFERENCES profiles(id),
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS onboarding_data (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
      date_of_birth TEXT,
      gender TEXT,
      country TEXT,
      height_cm REAL,
      weight_kg REAL,
      hypertension INTEGER DEFAULT 0,
      heart_disease INTEGER DEFAULT 0,
      smoking_history TEXT,
      mental_health TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS health_metrics (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      age INTEGER,
      gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
      exercise_level TEXT CHECK (exercise_level IN ('Low', 'Moderate', 'High')),
      diet_type TEXT CHECK (diet_type IN ('Vegetarian', 'Vegan', 'Balanced', 'Junk Food', 'Keto')),
      sleep_hours REAL,
      stress_level TEXT CHECK (stress_level IN ('Low', 'Moderate', 'High')),
      mental_health_condition TEXT,
      work_hours_per_week REAL,
      screen_time_per_day_hours REAL,
      social_interaction_score REAL,
      happiness_score REAL,
      bmi REAL,
      hypertension INTEGER DEFAULT 0,
      heart_disease INTEGER DEFAULT 0,
      hba1c_level REAL,
      blood_glucose_level INTEGER,
      risk_probability REAL,
      risk_percentage TEXT,
      risk_level TEXT,
      recommendation TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_notification_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
      fcm_token TEXT,
      preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ru', 'kaa', 'uz')),
      reminder_time TEXT DEFAULT '09:00',
      timezone TEXT DEFAULT 'UTC',
      enabled_notifications TEXT DEFAULT '{"critical":true,"warnings":true,"reminders":true,"positive":true}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      notification_type TEXT NOT NULL,
      triggered_at TEXT DEFAULT (datetime('now')),
      sent_status TEXT DEFAULT 'pending' CHECK (sent_status IN ('pending', 'sent', 'failed')),
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_glucose_readings_patient_timestamp ON glucose_readings(patient_id, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_health_metrics_patient_timestamp ON health_metrics(patient_id, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_notifications_log_user_type_time ON notifications_log(user_id, notification_type, triggered_at DESC);
  `);

  console.log('✓ Database initialized');
}

initializeDatabase();

// Add is_profile_complete column if it doesn't exist (migration)
try {
  db.exec(`ALTER TABLE profiles ADD COLUMN is_profile_complete INTEGER DEFAULT 0`);
  console.log('✓ Added is_profile_complete column');
} catch (error) {
  // Column already exists, ignore error
}

// Add assigned_doctor_id column if it doesn't exist (migration)
try {
  db.exec(`ALTER TABLE profiles ADD COLUMN assigned_doctor_id TEXT REFERENCES profiles(id)`);
  console.log('✓ Added assigned_doctor_id column');
} catch (error) {
  // Column already exists, ignore error
}

// Helper functions
const sqliteToBoolean = (value) => value === 1;
const booleanToSqlite = (value) => value ? 1 : 0;

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = db.prepare(`
    SELECT s.user_id, p.*
    FROM sessions s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
  `).get(token);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  req.user = {
    id: session.id,
    email: session.email,
    full_name: session.full_name,
    role: session.role,
  };

  next();
}

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, fullName, role, age, gender, assignedDoctorId } = req.body;

  try {
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if age and sex columns exist in profiles table
    const columns = db.prepare(`PRAGMA table_info(profiles)`).all();
    const hasAgeColumn = columns.some(col => col.name === 'age');
    const hasSexColumn = columns.some(col => col.name === 'sex');
    const hasAssignedDoctorIdColumn = columns.some(col => col.name === 'assigned_doctor_id');

    // Build the INSERT query dynamically based on available columns and data
    let insertQuery = 'INSERT INTO profiles (id, email, password_hash, full_name, role';
    let values = [userId, email, passwordHash, fullName, role];
    let placeholders = ['?', '?', '?', '?', '?'];

    // Add age if column exists and age is provided
    if (hasAgeColumn && age) {
      insertQuery += ', age';
      values.push(parseInt(age));
      placeholders.push('?');
    }

    // Add sex if column exists and gender is provided (and role is patient)
    if (hasSexColumn && gender && role === 'patient') {
      insertQuery += ', sex';
      values.push(gender);
      placeholders.push('?');
    }

    // Add assigned_doctor_id if column exists and assignedDoctorId is provided (and role is patient)
    if (hasAssignedDoctorIdColumn && assignedDoctorId && role === 'patient') {
      insertQuery += ', assigned_doctor_id';
      values.push(assignedDoctorId);
      placeholders.push('?');
    }

    insertQuery += `) VALUES (${placeholders.join(', ')})`;

    db.prepare(insertQuery).run(...values);

    if (role === 'patient') {
      const settingsId = uuidv4();
      db.prepare(`
        INSERT INTO patient_settings (id, patient_id)
        VALUES (?, ?)
      `).run(settingsId, userId);
    }

    // Create session token for the new user (like sign-in does)
    const sessionId = uuidv4();
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, userId, token, expiresAt);

    res.json({
      user: { id: userId, email, full_name: fullName, role },
      session: { token, expires_at: expiresAt },
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare(`
      SELECT id, email, password_hash, full_name, role
      FROM profiles
      WHERE email = ?
    `).get(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const sessionId = uuidv4();
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, user.id, token, expiresAt);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      session: { token, expires_at: expiresAt },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/signout', authMiddleware, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ success: true });
});

app.get('/api/auth/session', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Profiles routes
app.get('/api/profiles', authMiddleware, (req, res) => {
  const { role } = req.query;

  let query = 'SELECT id, email, full_name, role, date_of_birth, sex, clinic_location, assigned_doctor_id, created_at, updated_at FROM profiles';
  const params = [];

  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }

  query += ' ORDER BY full_name ASC';

  const profiles = db.prepare(query).all(...params);
  res.json(profiles);
});

app.get('/api/profiles/:id', authMiddleware, (req, res) => {
  const profile = db.prepare(`
    SELECT id, email, full_name, role, date_of_birth, sex, clinic_location, assigned_doctor_id, is_profile_complete, created_at, updated_at
    FROM profiles
    WHERE id = ?
  `).get(req.params.id);

  res.json(profile);
});

app.patch('/api/profiles/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Build dynamic update query
    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = ?`);
      // Convert boolean to integer for SQLite
      values.push(typeof value === 'boolean' ? booleanToSqlite(value) : value);
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add updated_at and id to values
    values.push(id);

    db.prepare(`
      UPDATE profiles
      SET ${fields.join(', ')}, updated_at = datetime('now')
      WHERE id = ?
    `).run(...values);

    // Return updated profile
    const profile = db.prepare(`
      SELECT id, email, full_name, role, date_of_birth, sex, clinic_location, assigned_doctor_id, is_profile_complete, created_at, updated_at
      FROM profiles
      WHERE id = ?
    `).get(id);

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list of doctors for patient registration
app.get('/api/doctors', (req, res) => {
  try {
    const doctors = db.prepare(`
      SELECT id, full_name, email, clinic_location
      FROM profiles
      WHERE role = 'doctor'
      ORDER BY full_name ASC
    `).all();

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient settings routes
app.get('/api/patient-settings/:patientId', authMiddleware, (req, res) => {
  const rawData = db.prepare('SELECT * FROM patient_settings WHERE patient_id = ?').get(req.params.patientId);

  if (!rawData) {
    return res.status(404).json({ error: 'Settings not found' });
  }

  const data = {
    ...rawData,
    large_text_enabled: sqliteToBoolean(rawData.large_text_enabled),
    high_contrast_enabled: sqliteToBoolean(rawData.high_contrast_enabled),
    voice_guidance_enabled: sqliteToBoolean(rawData.voice_guidance_enabled),
    data_sharing_enabled: sqliteToBoolean(rawData.data_sharing_enabled),
  };

  res.json(data);
});

app.patch('/api/patient-settings/:patientId', authMiddleware, (req, res) => {
  const updates = req.body;
  const fields = [];
  const values = [];

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    values.push(typeof value === 'boolean' ? booleanToSqlite(value) : value);
  });

  db.prepare(`
    UPDATE patient_settings
    SET ${fields.join(', ')}, updated_at = datetime('now')
    WHERE patient_id = ?
  `).run(...values, req.params.patientId);

  const rawData = db.prepare('SELECT * FROM patient_settings WHERE patient_id = ?').get(req.params.patientId);
  const data = {
    ...rawData,
    large_text_enabled: sqliteToBoolean(rawData.large_text_enabled),
    high_contrast_enabled: sqliteToBoolean(rawData.high_contrast_enabled),
    voice_guidance_enabled: sqliteToBoolean(rawData.voice_guidance_enabled),
    data_sharing_enabled: sqliteToBoolean(rawData.data_sharing_enabled),
  };

  res.json(data);
});

// Glucose readings routes
app.get('/api/glucose-readings', authMiddleware, (req, res) => {
  const { patient_id, start_date, end_date } = req.query;

  let query = 'SELECT * FROM glucose_readings WHERE 1=1';
  const params = [];

  if (patient_id) {
    query += ' AND patient_id = ?';
    params.push(patient_id);
  }

  if (start_date) {
    query += ' AND timestamp >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND timestamp <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY timestamp DESC';

  const readings = db.prepare(query).all(...params);
  res.json(readings);
});

app.post('/api/glucose-readings', authMiddleware, (req, res) => {
  const { patient_id, value_mg_dl, measurement_type, timestamp, note } = req.body;

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO glucose_readings (id, patient_id, value_mg_dl, measurement_type, timestamp, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, patient_id, value_mg_dl, measurement_type, timestamp, note || '');

    const newReading = db.prepare('SELECT * FROM glucose_readings WHERE id = ?').get(id);
    res.json(newReading);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meals routes
app.get('/api/meals', authMiddleware, (req, res) => {
  const { patient_id, start_date, end_date } = req.query;

  let query = 'SELECT * FROM meals WHERE 1=1';
  const params = [];

  if (patient_id) {
    query += ' AND patient_id = ?';
    params.push(patient_id);
  }

  if (start_date) {
    query += ' AND timestamp >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND timestamp <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY timestamp DESC';

  const meals = db.prepare(query).all(...params);
  res.json(meals);
});

app.post('/api/meals', authMiddleware, (req, res) => {
  const { patient_id, meal_name, carbs_g, portion_size, timestamp, note } = req.body;

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO meals (id, patient_id, meal_name, carbs_g, portion_size, timestamp, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, patient_id, meal_name, carbs_g || 0, portion_size, timestamp, note || '');

    const newMeal = db.prepare('SELECT * FROM meals WHERE id = ?').get(id);
    res.json(newMeal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activities routes
app.get('/api/activities', authMiddleware, (req, res) => {
  const { patient_id, start_date, end_date } = req.query;

  let query = 'SELECT * FROM activities WHERE 1=1';
  const params = [];

  if (patient_id) {
    query += ' AND patient_id = ?';
    params.push(patient_id);
  }

  if (start_date) {
    query += ' AND timestamp >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND timestamp <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY timestamp DESC';

  const activities = db.prepare(query).all(...params);
  res.json(activities);
});

app.post('/api/activities', authMiddleware, (req, res) => {
  const { patient_id, activity_type, duration_minutes, intensity, timestamp, note } = req.body;

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO activities (id, patient_id, activity_type, duration_minutes, intensity, timestamp, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, patient_id, activity_type, duration_minutes, intensity, timestamp, note || '');

    const newActivity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
    res.json(newActivity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Medications routes
app.get('/api/medications', authMiddleware, (req, res) => {
  const { patient_id, start_date, end_date } = req.query;

  let query = 'SELECT * FROM medications WHERE 1=1';
  const params = [];

  if (patient_id) {
    query += ' AND patient_id = ?';
    params.push(patient_id);
  }

  if (start_date) {
    query += ' AND timestamp >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND timestamp <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY timestamp DESC';

  const medications = db.prepare(query).all(...params);
  res.json(medications);
});

app.post('/api/medications', authMiddleware, (req, res) => {
  const { patient_id, medication_name, dose, status, missed_reason, timestamp, note } = req.body;

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO medications (id, patient_id, medication_name, dose, status, missed_reason, timestamp, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, patient_id, medication_name, dose, status, missed_reason, timestamp, note || '');

    const newMedication = db.prepare('SELECT * FROM medications WHERE id = ?').get(id);
    res.json(newMedication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Feelings routes
app.get('/api/feelings', authMiddleware, (req, res) => {
  const { patient_id, start_date, end_date } = req.query;

  let query = 'SELECT * FROM feelings WHERE 1=1';
  const params = [];

  if (patient_id) {
    query += ' AND patient_id = ?';
    params.push(patient_id);
  }

  if (start_date) {
    query += ' AND timestamp >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND timestamp <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY timestamp DESC';

  const feelings = db.prepare(query).all(...params);
  res.json(feelings);
});

app.post('/api/feelings', authMiddleware, (req, res) => {
  const { patient_id, mood_level, timestamp, note } = req.body;

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO feelings (id, patient_id, mood_level, timestamp, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, patient_id, mood_level, timestamp, note || '');

    const newFeeling = db.prepare('SELECT * FROM feelings WHERE id = ?').get(id);
    res.json(newFeeling);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clinical alerts routes
app.get('/api/clinical-alerts', authMiddleware, (req, res) => {
  const { patient_ids, status } = req.query;

  let query = 'SELECT * FROM clinical_alerts WHERE 1=1';
  const params = [];

  if (patient_ids) {
    const ids = patient_ids.split(',');
    query += ` AND patient_id IN (${ids.map(() => '?').join(',')})`;
    params.push(...ids);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  const alerts = db.prepare(query).all(...params);
  res.json(alerts);
});

// Onboarding data routes
app.post('/api/onboarding', authMiddleware, (req, res) => {
  const { patient_id, dateOfBirth, gender, country, height_cm, weight_kg, hypertension, heart_disease, smoking_history, mental_health } = req.body;

  try {
    const id = uuidv4();

    // Convert mental_health array to JSON string for storage
    const mentalHealthJson = JSON.stringify(mental_health || []);

    // Check if onboarding data already exists for this patient
    const existing = db.prepare('SELECT id FROM onboarding_data WHERE patient_id = ?').get(patient_id);

    if (existing) {
      // Update existing record
      db.prepare(`
        UPDATE onboarding_data
        SET date_of_birth = ?,
            gender = ?,
            country = ?,
            height_cm = ?,
            weight_kg = ?,
            hypertension = ?,
            heart_disease = ?,
            smoking_history = ?,
            mental_health = ?,
            updated_at = datetime('now')
        WHERE patient_id = ?
      `).run(
        dateOfBirth,
        gender,
        country,
        parseFloat(height_cm),
        parseFloat(weight_kg),
        booleanToSqlite(hypertension),
        booleanToSqlite(heart_disease),
        smoking_history,
        mentalHealthJson,
        patient_id
      );

      res.json({ success: true, id: existing.id });
    } else {
      // Insert new record
      db.prepare(`
        INSERT INTO onboarding_data (
          id, patient_id, date_of_birth, gender, country,
          height_cm, weight_kg, hypertension, heart_disease,
          smoking_history, mental_health
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        patient_id,
        dateOfBirth,
        gender,
        country,
        parseFloat(height_cm),
        parseFloat(weight_kg),
        booleanToSqlite(hypertension),
        booleanToSqlite(heart_disease),
        smoking_history,
        mentalHealthJson
      );

      res.json({ success: true, id });
    }
  } catch (error) {
    console.error('Onboarding save error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/onboarding/:patientId', authMiddleware, (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM onboarding_data WHERE patient_id = ?').get(req.params.patientId);

    if (!data) {
      return res.status(404).json({ error: 'Onboarding data not found' });
    }

    // Parse mental_health JSON string back to array
    const result = {
      ...data,
      hypertension: sqliteToBoolean(data.hypertension),
      heart_disease: sqliteToBoolean(data.heart_disease),
      mental_health: JSON.parse(data.mental_health || '[]'),
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health metrics routes
app.get('/api/health-metrics', authMiddleware, (req, res) => {
  const { patient_id, start_date, end_date } = req.query;

  let query = 'SELECT * FROM health_metrics WHERE 1=1';
  const params = [];

  if (patient_id) {
    query += ' AND patient_id = ?';
    params.push(patient_id);
  }

  if (start_date) {
    query += ' AND timestamp >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND timestamp <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY timestamp DESC';

  const metrics = db.prepare(query).all(...params);
  res.json(metrics);
});

app.post('/api/health-metrics', authMiddleware, (req, res) => {
  const {
    patient_id,
    age,
    gender,
    exercise_level,
    diet_type,
    sleep_hours,
    stress_level,
    mental_health_condition,
    work_hours_per_week,
    screen_time_per_day_hours,
    social_interaction_score,
    happiness_score,
    bmi,
    hypertension,
    heart_disease,
    hba1c_level,
    blood_glucose_level,
    risk_probability,
    risk_percentage,
    risk_level,
    recommendation,
    timestamp
  } = req.body;

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO health_metrics (
        id, patient_id, age, gender, exercise_level, diet_type, sleep_hours, stress_level,
        mental_health_condition, work_hours_per_week, screen_time_per_day_hours,
        social_interaction_score, happiness_score, bmi, hypertension, heart_disease,
        hba1c_level, blood_glucose_level, risk_probability, risk_percentage, risk_level,
        recommendation, timestamp
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      patient_id,
      parseInt(age) || null,
      gender,
      exercise_level,
      diet_type,
      parseFloat(sleep_hours) || null,
      stress_level,
      mental_health_condition || 'None',
      parseFloat(work_hours_per_week) || null,
      parseFloat(screen_time_per_day_hours) || null,
      parseFloat(social_interaction_score) || null,
      parseFloat(happiness_score) || null,
      parseFloat(bmi) || null,
      booleanToSqlite(hypertension),
      booleanToSqlite(heart_disease),
      parseFloat(hba1c_level) || null,
      parseInt(blood_glucose_level) || null,
      parseFloat(risk_probability) || null,
      risk_percentage || null,
      risk_level || null,
      recommendation || null,
      timestamp || new Date().toISOString()
    );

    const newMetric = db.prepare('SELECT * FROM health_metrics WHERE id = ?').get(id);
    res.json(newMetric);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Autofill proxy endpoint
app.get('/api/autofill/:userType', authMiddleware, async (req, res) => {
  try {
    const { userType } = req.params;

    console.log('Autofill request - User ID:', req.user.id, 'UserType:', userType);

    // Only allow for specific user
    if (req.user.id !== '30af11c8-568e-4bce-837c-c5dfb4f0833b') {
      console.log('Autofill denied - User ID mismatch:', req.user.id, 'Expected:', '30af11c8-568e-4bce-837c-c5dfb4f0833b');
      return res.status(403).json({ error: 'Autofill not available for this user' });
    }

    // Import fetch dynamically for Node.js
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`https://web-production-10c3.up.railway.app/autofill/${userType}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Autofill proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch autofill data', details: error.message });
  }
});

// Notification API endpoints
app.post('/api/notifications/register-token', authMiddleware, (req, res) => {
  const { fcmToken } = req.body;

  try {
    // Check if settings exist for user
    const existing = db.prepare(`
      SELECT id FROM user_notification_settings WHERE user_id = ?
    `).get(req.user.id);

    if (existing) {
      // Update existing settings
      db.prepare(`
        UPDATE user_notification_settings
        SET fcm_token = ?, updated_at = datetime('now')
        WHERE user_id = ?
      `).run(fcmToken, req.user.id);
    } else {
      // Create new settings
      const id = uuidv4();
      db.prepare(`
        INSERT INTO user_notification_settings (id, user_id, fcm_token)
        VALUES (?, ?, ?)
      `).run(id, req.user.id, fcmToken);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/settings', authMiddleware, (req, res) => {
  const { preferredLanguage, reminderTime, timezone, enabledNotifications } = req.body;

  try {
    // Check if settings exist
    const existing = db.prepare(`
      SELECT id FROM user_notification_settings WHERE user_id = ?
    `).get(req.user.id);

    if (existing) {
      // Build update query dynamically
      const fields = [];
      const values = [];

      if (preferredLanguage !== undefined) {
        fields.push('preferred_language = ?');
        values.push(preferredLanguage);
      }
      if (reminderTime !== undefined) {
        fields.push('reminder_time = ?');
        values.push(reminderTime);
      }
      if (timezone !== undefined) {
        fields.push('timezone = ?');
        values.push(timezone);
      }
      if (enabledNotifications !== undefined) {
        fields.push('enabled_notifications = ?');
        values.push(JSON.stringify(enabledNotifications));
      }

      if (fields.length > 0) {
        values.push(req.user.id);
        db.prepare(`
          UPDATE user_notification_settings
          SET ${fields.join(', ')}, updated_at = datetime('now')
          WHERE user_id = ?
        `).run(...values);
      }
    } else {
      // Create new settings
      const id = uuidv4();
      db.prepare(`
        INSERT INTO user_notification_settings (
          id, user_id, preferred_language, reminder_time, timezone, enabled_notifications
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        req.user.id,
        preferredLanguage || 'en',
        reminderTime || '09:00',
        timezone || 'UTC',
        JSON.stringify(enabledNotifications || { critical: true, warnings: true, reminders: true, positive: true })
      );
    }

    const settings = db.prepare(`
      SELECT * FROM user_notification_settings WHERE user_id = ?
    `).get(req.user.id);

    res.json({
      ...settings,
      enabled_notifications: JSON.parse(settings.enabled_notifications)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications/settings', authMiddleware, (req, res) => {
  try {
    const settings = db.prepare(`
      SELECT * FROM user_notification_settings WHERE user_id = ?
    `).get(req.user.id);

    if (!settings) {
      return res.json({
        preferred_language: 'en',
        reminder_time: '09:00',
        timezone: 'UTC',
        enabled_notifications: { critical: true, warnings: true, reminders: true, positive: true }
      });
    }

    res.json({
      ...settings,
      enabled_notifications: JSON.parse(settings.enabled_notifications)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications/history', authMiddleware, (req, res) => {
  const { limit = 50 } = req.query;

  try {
    const history = db.prepare(`
      SELECT * FROM notifications_log
      WHERE user_id = ?
      ORDER BY triggered_at DESC
      LIMIT ?
    `).all(req.user.id, parseInt(limit));

    res.json(history.map(h => ({
      ...h,
      metadata: JSON.parse(h.metadata || '{}')
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test notification endpoint (for development)
app.post('/api/notifications/test', authMiddleware, async (req, res) => {
  const { notificationType, data } = req.body;

  try {
    const result = await notificationService.sendPushNotification(
      db,
      req.user.id,
      notificationType,
      data || {}
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export patient report endpoint
app.post('/api/patients/:patientId/export', authMiddleware, async (req, res) => {
  const { format } = req.body; // 'pdf' or 'csv'
  const { patientId } = req.params;

  try {
    // Verify doctor has access to this patient
    if (req.user.role === 'doctor') {
      const patient = db.prepare(`
        SELECT p.*, od.date_of_birth, od.gender
        FROM profiles p
        LEFT JOIN onboarding_data od ON p.id = od.patient_id
        WHERE p.id = ? AND p.assigned_doctor_id = ?
      `).get(patientId, req.user.id);

      if (!patient) {
        return res.status(403).json({ error: 'Access denied to this patient' });
      }
    } else if (req.user.role === 'patient') {
      // Patients can only export their own data
      if (req.user.id !== patientId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Fetch patient data
    const patientData = db.prepare(`
      SELECT p.*, od.date_of_birth, od.gender as sex
      FROM profiles p
      LEFT JOIN onboarding_data od ON p.id = od.patient_id
      WHERE p.id = ?
    `).get(patientId);

    if (!patientData) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Fetch glucose readings (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const readings = db.prepare(`
      SELECT * FROM glucose_readings
      WHERE patient_id = ? AND timestamp >= ?
      ORDER BY timestamp DESC
    `).all(patientId, ninetyDaysAgo.toISOString());

    // Fetch health metrics (latest)
    const healthMetrics = db.prepare(`
      SELECT * FROM health_metrics
      WHERE patient_id = ?
      ORDER BY timestamp DESC
      LIMIT 5
    `).all(patientId);

    // Generate report based on format
    let buffer, filename, contentType;

    if (format === 'pdf') {
      buffer = await exportService.generatePDFReport(patientData, readings, healthMetrics);
      filename = `medical-report-${patientData.full_name.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      contentType = 'application/pdf';
    } else if (format === 'csv') {
      buffer = await exportService.generateCSVReport(patientData, readings);
      filename = `glucose-data-${patientData.full_name.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      contentType = 'text/csv';
    } else {
      return res.status(400).json({ error: 'Invalid format. Use "pdf" or "csv"' });
    }

    // Set headers and send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

// Initialize Firebase and set up cron jobs
notificationService.initializeFirebase();

// Cron job: Check high risk users every hour
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Running hourly high risk check...');
  try {
    await notificationService.checkHighRiskUsers(db);
  } catch (error) {
    console.error('[CRON] Error in high risk check:', error);
  }
});

// Cron job: Check critical glucose every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Running critical glucose check...');
  try {
    await notificationService.checkCriticalGlucose(db);
  } catch (error) {
    console.error('[CRON] Error in critical glucose check:', error);
  }
});

// Cron job: Check consistent high glucose daily at 8 PM
cron.schedule('0 20 * * *', async () => {
  console.log('[CRON] Running consistent high glucose check...');
  try {
    await notificationService.checkConsistentHighGlucose(db);
  } catch (error) {
    console.error('[CRON] Error in consistent high check:', error);
  }
});

// Cron job: Send log reminders daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Running log reminder check...');
  try {
    await notificationService.checkLogReminders(db);
  } catch (error) {
    console.error('[CRON] Error in log reminder check:', error);
  }
});

// Cron job: Send positive reinforcement every Sunday at 6 PM
cron.schedule('0 18 * * 0', async () => {
  console.log('[CRON] Running positive reinforcement check...');
  try {
    await notificationService.checkPositiveReinforcement(db);
  } catch (error) {
    console.error('[CRON] Error in positive reinforcement check:', error);
  }
});

// Cron job: Check dinner spike patterns every Monday at 10 AM
cron.schedule('0 10 * * 1', async () => {
  console.log('[CRON] Running dinner spike pattern check...');
  try {
    await notificationService.checkDinnerSpikePattern(db);
  } catch (error) {
    console.error('[CRON] Error in dinner spike pattern check:', error);
  }
});

console.log('✓ Notification cron jobs scheduled');

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));

  // Handle React routing, return all requests to React app
  // Express 5 requires /* instead of * for wildcard routes
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Bind to 0.0.0.0 for Railway/cloud hosting
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✓ Server running on http://${HOST}:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ CORS Origin: ${CORS_ORIGIN}`);
});
