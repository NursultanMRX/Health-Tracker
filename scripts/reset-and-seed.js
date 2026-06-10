/**
 * reset-and-seed.js
 *
 * Wipes diabetes.db and rebuilds it from scratch:
 *   1. Deletes the existing DB (and WAL/SHM sidecar files)
 *   2. Recreates the full schema (mirrors server.js)
 *   3. Inserts one doctor + five patients with known credentials
 *   4. Seeds 60 days of realistic glucose/meal/med/activity/mood data
 *
 * Usage: npm run reset-db   (or: node scripts/reset-and-seed.js)
 *
 * IMPORTANT: stop the dev server (npm run dev:all) before running,
 * otherwise the .db file is locked.
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'diabetes.db');

// ---------- 1. Wipe ----------
for (const suffix of ['', '-shm', '-wal']) {
  const f = DB_PATH + suffix;
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log(`  deleted ${path.basename(f)}`);
  }
}

// ---------- 2. Recreate schema ----------
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

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
    assigned_doctor_id TEXT REFERENCES profiles(id),
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
console.log('  schema recreated');

// ---------- 3. Insert accounts ----------
const DOCTOR = {
  email: 'doctor@health.com',
  password: 'doctor1234',
  fullName: 'Dr. Sarah Mitchell',
};

const PATIENTS = [
  { email: 'amelia@health.com',  password: 'patient1234', fullName: 'Amelia Harper',   sex: 'female', dob: '1985-04-12' },
  { email: 'ethan@health.com',   password: 'patient1234', fullName: 'Ethan Carter',    sex: 'male',   dob: '1978-09-03' },
  { email: 'olivia@health.com',  password: 'patient1234', fullName: 'Olivia Bennett',  sex: 'female', dob: '1992-11-21' },
  { email: 'noah@health.com',    password: 'patient1234', fullName: 'Noah Thompson',   sex: 'male',   dob: '1988-02-17' },
  { email: 'isabella@health.com',password: 'patient1234', fullName: 'Isabella Wright', sex: 'female', dob: '1995-07-30' },
];

const insertProfile = db.prepare(`
  INSERT INTO profiles (id, email, password_hash, full_name, role, date_of_birth, sex, is_profile_complete, assigned_doctor_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
`);
const insertSettings = db.prepare(`
  INSERT INTO patient_settings (id, patient_id) VALUES (?, ?)
`);

const doctorId = uuid();
insertProfile.run(
  doctorId, DOCTOR.email, bcrypt.hashSync(DOCTOR.password, 10),
  DOCTOR.fullName, 'doctor', null, null, null
);
console.log(`  doctor: ${DOCTOR.email}`);

const patientIds = [];
for (const p of PATIENTS) {
  const id = uuid();
  insertProfile.run(
    id, p.email, bcrypt.hashSync(p.password, 10),
    p.fullName, 'patient', p.dob, p.sex, doctorId
  );
  insertSettings.run(uuid(), id);
  patientIds.push({ id, ...p });
  console.log(`  patient: ${p.email}`);
}

// ---------- 4. Seed 60 days of fake data ----------
const SEED_TAG = '[seed]';
const DAYS = 60;

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const chance = (p) => Math.random() < p;

function toSqlTs(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
         `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}
function dayAt(daysAgo, hours, minutes = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hours, minutes + randInt(-8, 8), randInt(0, 59), 0);
  return d;
}

function glucoseFor(type, ctrl) {
  const base = {
    fasting:      rand(85, 110) + (1 - ctrl) * rand(0, 35),
    prebreakfast: rand(90, 115) + (1 - ctrl) * rand(0, 30),
    postprandial: rand(120, 160) + (1 - ctrl) * rand(0, 60),
    random:       rand(95, 130) + (1 - ctrl) * rand(0, 40),
    bedtime:      rand(100, 135) + (1 - ctrl) * rand(0, 35),
  }[type];
  const spike = chance(0.05) ? rand(40, 90) : 0;
  const dip   = chance(0.03) ? -rand(15, 30) : 0;
  return Math.max(55, Math.round(base + spike + dip));
}

const BREAKFASTS = [
  { name: 'Oatmeal with berries',   carbs: 45, protein: 8,  fat: 5  },
  { name: 'Greek yogurt & granola', carbs: 38, protein: 18, fat: 6  },
  { name: 'Scrambled eggs & toast', carbs: 28, protein: 20, fat: 14 },
  { name: 'Avocado toast',          carbs: 32, protein: 9,  fat: 16 },
  { name: 'Protein smoothie',       carbs: 30, protein: 25, fat: 4  },
  { name: 'Whole grain pancakes',   carbs: 55, protein: 10, fat: 8  },
];
const LUNCHES = [
  { name: 'Grilled chicken salad',  carbs: 18, protein: 38, fat: 12 },
  { name: 'Quinoa bowl with veggies', carbs: 50, protein: 14, fat: 10 },
  { name: 'Turkey sandwich',        carbs: 42, protein: 28, fat: 9  },
  { name: 'Lentil soup & bread',    carbs: 48, protein: 18, fat: 6  },
  { name: 'Tuna wrap',              carbs: 35, protein: 26, fat: 11 },
  { name: 'Brown rice & stir fry',  carbs: 55, protein: 22, fat: 12 },
];
const DINNERS = [
  { name: 'Baked salmon & vegetables', carbs: 22, protein: 36, fat: 18 },
  { name: 'Grilled chicken & sweet potato', carbs: 40, protein: 38, fat: 9 },
  { name: 'Beef stew',              carbs: 35, protein: 30, fat: 16 },
  { name: 'Pasta with marinara',    carbs: 65, protein: 16, fat: 10 },
  { name: 'Tofu curry & rice',      carbs: 58, protein: 20, fat: 14 },
  { name: 'Steak & roasted potatoes', carbs: 38, protein: 42, fat: 22 },
];
const SNACKS = [
  { name: 'Apple & peanut butter',  carbs: 25, protein: 6,  fat: 8  },
  { name: 'Mixed nuts',             carbs: 8,  protein: 6,  fat: 14 },
  { name: 'Cheese & crackers',      carbs: 18, protein: 8,  fat: 9  },
  { name: 'Hummus & carrots',       carbs: 16, protein: 5,  fat: 6  },
];
const ACTIVITIES = ['walk', 'brisk_walk', 'jog', 'household_chores', 'gym'];
const MOOD_NOTES = {
  1: ['Rough day', 'Feeling drained', 'Stressed'],
  2: ['A bit low', 'Tired', 'Off today'],
  3: ['Steady', 'Okay', 'Normal day'],
  4: ['Feeling good', 'Productive day', 'Positive'],
  5: ['Great energy!', 'Amazing day', 'Feeling strong'],
};

const insertGlucose  = db.prepare(`INSERT INTO glucose_readings (id, patient_id, timestamp, value_mg_dl, measurement_type, tags, note) VALUES (?, ?, ?, ?, ?, '[]', ?)`);
const insertMeal     = db.prepare(`INSERT INTO meals (id, patient_id, timestamp, meal_name, carbs_g, protein_g, fat_g, portion_size, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertMed      = db.prepare(`INSERT INTO medications (id, patient_id, timestamp, medication_name, dose, status, missed_reason, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const insertActivity = db.prepare(`INSERT INTO activities (id, patient_id, timestamp, activity_type, duration_minutes, intensity, note) VALUES (?, ?, ?, ?, ?, ?, ?)`);
const insertFeeling  = db.prepare(`INSERT INTO feelings (id, patient_id, timestamp, mood_level, note) VALUES (?, ?, ?, ?, ?)`);

function seedFor(patient) {
  const ctrl = rand(0.45, 0.9);
  const activityRate = rand(0.35, 0.75);
  const adherence    = rand(0.78, 0.97);
  const moodBias     = rand(2.6, 4.0);
  let c = { g: 0, m: 0, x: 0, a: 0, f: 0 };

  for (let d = DAYS; d >= 0; d--) {
    for (const r of [
      { t: 'fasting',      h: 6,  mn: 30 },
      { t: 'postprandial', h: 13, mn: 30 },
      { t: 'random',       h: 17, mn: 0  },
      { t: 'bedtime',      h: 22, mn: 30 },
    ]) {
      insertGlucose.run(uuid(), patient.id, toSqlTs(dayAt(d, r.h, r.mn)), glucoseFor(r.t, ctrl), r.t, SEED_TAG);
      c.g++;
    }

    const meals = [
      { i: pick(BREAKFASTS), h: 7,  mn: 30, p: 'medium' },
      { i: pick(LUNCHES),    h: 12, mn: 30, p: 'medium' },
      { i: pick(DINNERS),    h: 19, mn: 0,  p: 'medium' },
    ];
    if (chance(0.55)) meals.push({ i: pick(SNACKS), h: 15, mn: 30, p: 'small' });
    for (const m of meals) {
      insertMeal.run(uuid(), patient.id, toSqlTs(dayAt(d, m.h, m.mn)),
        m.i.name, m.i.carbs, m.i.protein, m.i.fat, m.p, SEED_TAG);
      c.m++;
    }

    for (const slot of [{ h: 8 }, { h: 20 }]) {
      const taken = chance(adherence);
      insertMed.run(uuid(), patient.id, toSqlTs(dayAt(d, slot.h, 0)),
        'Metformin', '500 mg',
        taken ? 'taken' : 'missed',
        taken ? null : pick(['forgot', 'travel', 'side effects', 'busy']),
        SEED_TAG);
      c.x++;
    }

    if (chance(activityRate)) {
      const intensity = pick(['low', 'low', 'medium', 'medium', 'high']);
      const duration = { low: randInt(15, 30), medium: randInt(25, 50), high: randInt(30, 60) }[intensity];
      insertActivity.run(uuid(), patient.id, toSqlTs(dayAt(d, 17, 30)),
        pick(ACTIVITIES), duration, intensity, SEED_TAG);
      c.a++;
    }

    if (chance(0.85)) {
      const mood = Math.max(1, Math.min(5, Math.round(moodBias + rand(-1, 1))));
      insertFeeling.run(uuid(), patient.id, toSqlTs(dayAt(d, 21, 0)),
        mood, `${pick(MOOD_NOTES[mood])} ${SEED_TAG}`);
      c.f++;
    }
  }
  return c;
}

const seedAll = db.transaction(() => {
  for (const p of patientIds) {
    const r = seedFor(p);
    console.log(`  ${p.fullName.padEnd(20)} glucose:${r.g} meals:${r.m} meds:${r.x} activities:${r.a} feelings:${r.f}`);
  }
});

console.log('\nSeeding 60 days for each patient...');
seedAll();

db.close();
console.log('\n✓ Done. You can now run: npm run dev:all');
