import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the database path
const dbPath = path.join(process.cwd(), 'diabetes.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize the database schema
export function initializeDatabase() {
  db.exec(`
    -- Profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('patient', 'doctor')),
      date_of_birth TEXT,
      sex TEXT CHECK (sex IN ('male', 'female', 'other')),
      clinic_location TEXT,
      primary_care_physician_id TEXT REFERENCES profiles(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Patient settings table
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

    -- Doctor-patient access table
    CREATE TABLE IF NOT EXISTS doctor_patient_access (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      access_granted_at TEXT DEFAULT (datetime('now')),
      access_revoked_at TEXT,
      is_active INTEGER DEFAULT 1,
      UNIQUE(doctor_id, patient_id)
    );

    -- Glucose readings table
    CREATE TABLE IF NOT EXISTS glucose_readings (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      value_mg_dl INTEGER NOT NULL,
      measurement_type TEXT CHECK (measurement_type IN ('prebreakfast', 'postprandial', 'fasting', 'random', 'bedtime')),
      tags TEXT DEFAULT '[]',
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_glucose_readings_patient_timestamp
      ON glucose_readings(patient_id, timestamp DESC);

    -- Meals table
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      meal_name TEXT NOT NULL,
      carbs_g INTEGER DEFAULT 0,
      protein_g INTEGER DEFAULT 0,
      fat_g INTEGER DEFAULT 0,
      portion_size TEXT CHECK (portion_size IN ('small', 'medium', 'large')),
      photo_url TEXT,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_meals_patient_timestamp
      ON meals(patient_id, timestamp DESC);

    -- Medications table
    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      medication_name TEXT NOT NULL,
      dose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'taken' CHECK (status IN ('taken', 'missed', 'delayed')),
      missed_reason TEXT CHECK (missed_reason IN ('forgot', 'busy', 'side_effects')),
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_medications_patient_timestamp
      ON medications(patient_id, timestamp DESC);

    -- Activities table
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      activity_type TEXT NOT NULL CHECK (activity_type IN ('walk', 'brisk_walk', 'jog', 'household_chores', 'gym')),
      duration_minutes INTEGER NOT NULL,
      intensity TEXT NOT NULL DEFAULT 'low' CHECK (intensity IN ('low', 'medium', 'high')),
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_activities_patient_timestamp
      ON activities(patient_id, timestamp DESC);

    -- Feelings table
    CREATE TABLE IF NOT EXISTS feelings (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 5),
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_feelings_patient_timestamp
      ON feelings(patient_id, timestamp DESC);

    -- Reminders table
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      reminder_type TEXT NOT NULL CHECK (reminder_type IN ('medication', 'glucose_check', 'appointment')),
      medication_name TEXT,
      time TEXT NOT NULL,
      repeat_pattern TEXT NOT NULL DEFAULT 'daily' CHECK (repeat_pattern IN ('daily', 'weekdays', 'custom')),
      custom_days TEXT DEFAULT '[]',
      enabled INTEGER DEFAULT 1,
      snooze_minutes INTEGER DEFAULT 10,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Clinical alerts table
    CREATE TABLE IF NOT EXISTS clinical_alerts (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      alert_type TEXT NOT NULL CHECK (alert_type IN ('consecutive_hypoglycemia', 'tir_decreased', 'high_cv', 'nocturnal_hypoglycemia', 'hyperglycemia_pattern')),
      severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
      message TEXT NOT NULL,
      suggested_action TEXT,
      detected_at TEXT DEFAULT (datetime('now')),
      acknowledged_at TEXT,
      acknowledged_by TEXT REFERENCES profiles(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'snoozed', 'resolved')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_clinical_alerts_patient_status
      ON clinical_alerts(patient_id, status);

    -- Sessions table for authentication
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  `);

  console.log('✓ SQLite database initialized at:', dbPath);
}

// Helper function to convert SQLite boolean (0/1) to JS boolean
export function sqliteToBoolean(value: number | null): boolean {
  return value === 1;
}

// Helper function to convert JS boolean to SQLite (0/1)
export function booleanToSqlite(value: boolean): number {
  return value ? 1 : 0;
}
