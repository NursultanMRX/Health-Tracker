/**
 * seed-fake-dates.js
 *
 * Populates the SQLite database with 60 days of realistic, time-distributed
 * health data for every existing patient so the dashboards/charts have
 * something beautiful to render.
 *
 * Usage: npm run seed   (or: node scripts/seed-fake-dates.js)
 *
 * Safe to run multiple times — uses a tag in the `note` field
 * ("[seed]") so a second run can wipe its own previous inserts first.
 */

import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'diabetes.db'));
db.pragma('foreign_keys = ON');

const SEED_TAG = '[seed]';
const DAYS = 60;

// ---------- helpers ----------
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const chance = (p) => Math.random() < p;

function toSqlTs(date) {
  // SQLite datetime('now') format: "YYYY-MM-DD HH:MM:SS"
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

// ---------- realistic generators ----------
function glucoseFor(measurementType, patientProfile) {
  // patientProfile.controlLevel in 0..1 (1 = great control)
  const c = patientProfile.controlLevel;
  const base = {
    fasting:      rand(85, 110) + (1 - c) * rand(0, 35),
    prebreakfast: rand(90, 115) + (1 - c) * rand(0, 30),
    postprandial: rand(120, 160) + (1 - c) * rand(0, 60),
    random:       rand(95, 130) + (1 - c) * rand(0, 40),
    bedtime:      rand(100, 135) + (1 - c) * rand(0, 35),
  }[measurementType];
  // small chance of a notable spike/dip
  const spike = chance(0.05) ? rand(40, 90) : 0;
  const dip   = chance(0.03) ? -rand(15, 30) : 0;
  return Math.max(55, Math.round(base + spike + dip));
}

const BREAKFASTS = [
  { name: 'Oatmeal with berries',         carbs: 45, protein: 8,  fat: 5 },
  { name: 'Greek yogurt & granola',       carbs: 38, protein: 18, fat: 6 },
  { name: 'Scrambled eggs & toast',       carbs: 28, protein: 20, fat: 14 },
  { name: 'Avocado toast',                carbs: 32, protein: 9,  fat: 16 },
  { name: 'Protein smoothie',             carbs: 30, protein: 25, fat: 4 },
  { name: 'Whole grain pancakes',         carbs: 55, protein: 10, fat: 8 },
];
const LUNCHES = [
  { name: 'Grilled chicken salad',        carbs: 18, protein: 38, fat: 12 },
  { name: 'Quinoa bowl with veggies',     carbs: 50, protein: 14, fat: 10 },
  { name: 'Turkey sandwich',              carbs: 42, protein: 28, fat: 9  },
  { name: 'Lentil soup & bread',          carbs: 48, protein: 18, fat: 6  },
  { name: 'Tuna wrap',                    carbs: 35, protein: 26, fat: 11 },
  { name: 'Brown rice & stir fry',        carbs: 55, protein: 22, fat: 12 },
];
const DINNERS = [
  { name: 'Baked salmon & vegetables',    carbs: 22, protein: 36, fat: 18 },
  { name: 'Grilled chicken & sweet potato', carbs: 40, protein: 38, fat: 9 },
  { name: 'Beef stew',                    carbs: 35, protein: 30, fat: 16 },
  { name: 'Pasta with marinara',          carbs: 65, protein: 16, fat: 10 },
  { name: 'Tofu curry & rice',            carbs: 58, protein: 20, fat: 14 },
  { name: 'Steak & roasted potatoes',     carbs: 38, protein: 42, fat: 22 },
];
const SNACKS = [
  { name: 'Apple & peanut butter',        carbs: 25, protein: 6,  fat: 8 },
  { name: 'Mixed nuts',                   carbs: 8,  protein: 6,  fat: 14 },
  { name: 'Cheese & crackers',            carbs: 18, protein: 8,  fat: 9 },
  { name: 'Hummus & carrots',             carbs: 16, protein: 5,  fat: 6 },
];

const ACTIVITIES = ['walk', 'brisk_walk', 'jog', 'household_chores', 'gym'];

const MEDS = [
  { name: 'Metformin', dose: '500 mg' },
  { name: 'Metformin', dose: '1000 mg' },
];

const MOOD_NOTES = {
  1: ['Rough day', 'Feeling drained', 'Stressed'],
  2: ['A bit low', 'Tired', 'Off today'],
  3: ['Steady', 'Okay', 'Normal day'],
  4: ['Feeling good', 'Productive day', 'Positive'],
  5: ['Great energy!', 'Amazing day', 'Feeling strong'],
};

// ---------- seeding ----------
function cleanPreviousSeed(patientId) {
  const tables = ['glucose_readings', 'meals', 'medications', 'activities', 'feelings'];
  for (const t of tables) {
    db.prepare(`DELETE FROM ${t} WHERE patient_id = ? AND note LIKE ?`).run(patientId, `%${SEED_TAG}%`);
  }
}

function seedPatient(patient) {
  // assign each patient a slightly different "control profile" so charts vary
  const profile = {
    controlLevel: rand(0.45, 0.9),         // diabetes control quality
    activityRate: rand(0.35, 0.75),        // how often they exercise
    adherenceRate: rand(0.78, 0.97),       // how often they take meds on time
    moodBias:     rand(2.6, 4.0),          // mood center
  };

  cleanPreviousSeed(patient.id);

  const insertGlucose = db.prepare(`
    INSERT INTO glucose_readings (id, patient_id, timestamp, value_mg_dl, measurement_type, tags, note)
    VALUES (?, ?, ?, ?, ?, '[]', ?)
  `);
  const insertMeal = db.prepare(`
    INSERT INTO meals (id, patient_id, timestamp, meal_name, carbs_g, protein_g, fat_g, portion_size, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMed = db.prepare(`
    INSERT INTO medications (id, patient_id, timestamp, medication_name, dose, status, missed_reason, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertActivity = db.prepare(`
    INSERT INTO activities (id, patient_id, timestamp, activity_type, duration_minutes, intensity, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertFeeling = db.prepare(`
    INSERT INTO feelings (id, patient_id, timestamp, mood_level, note)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    let counts = { glucose: 0, meals: 0, meds: 0, activities: 0, feelings: 0 };

    for (let d = DAYS; d >= 0; d--) {
      // ---- glucose: 4 readings/day (fasting, postprandial lunch, random afternoon, bedtime) ----
      const readings = [
        { type: 'fasting',      time: dayAt(d, 6, 30) },
        { type: 'postprandial', time: dayAt(d, 13, 30) },
        { type: 'random',       time: dayAt(d, 17, 0)  },
        { type: 'bedtime',      time: dayAt(d, 22, 30) },
      ];
      for (const r of readings) {
        insertGlucose.run(
          uuid(), patient.id, toSqlTs(r.time),
          glucoseFor(r.type, profile), r.type,
          SEED_TAG
        );
        counts.glucose++;
      }

      // ---- meals: breakfast / lunch / dinner + occasional snack ----
      const meals = [
        { item: pick(BREAKFASTS), time: dayAt(d, 7, 30),  portion: 'medium' },
        { item: pick(LUNCHES),    time: dayAt(d, 12, 30), portion: 'medium' },
        { item: pick(DINNERS),    time: dayAt(d, 19, 0),  portion: 'medium' },
      ];
      if (chance(0.55)) meals.push({ item: pick(SNACKS), time: dayAt(d, 15, 30), portion: 'small' });
      for (const m of meals) {
        insertMeal.run(
          uuid(), patient.id, toSqlTs(m.time),
          m.item.name, m.item.carbs, m.item.protein, m.item.fat,
          m.portion, SEED_TAG
        );
        counts.meals++;
      }

      // ---- medications: Metformin morning + evening, with adherence chance ----
      const medSlots = [
        { time: dayAt(d, 8, 0)  },
        { time: dayAt(d, 20, 0) },
      ];
      for (const slot of medSlots) {
        const taken = chance(profile.adherenceRate);
        const med = MEDS[0];
        insertMed.run(
          uuid(), patient.id, toSqlTs(slot.time),
          med.name, med.dose,
          taken ? 'taken' : 'missed',
          taken ? null : pick(['forgot', 'travel', 'side effects', 'busy']),
          SEED_TAG
        );
        counts.meds++;
      }

      // ---- activity: ~activityRate chance per day ----
      if (chance(profile.activityRate)) {
        const type = pick(ACTIVITIES);
        const intensity = pick(['low', 'low', 'medium', 'medium', 'high']);
        const duration = { low: randInt(15, 30), medium: randInt(25, 50), high: randInt(30, 60) }[intensity];
        insertActivity.run(
          uuid(), patient.id, toSqlTs(dayAt(d, 17, 30)),
          type, duration, intensity, SEED_TAG
        );
        counts.activities++;
      }

      // ---- feeling: 1 mood entry/day (sometimes skipped) ----
      if (chance(0.85)) {
        const mood = Math.max(1, Math.min(5, Math.round(profile.moodBias + rand(-1, 1))));
        insertFeeling.run(
          uuid(), patient.id, toSqlTs(dayAt(d, 21, 0)),
          mood, `${pick(MOOD_NOTES[mood])} ${SEED_TAG}`
        );
        counts.feelings++;
      }
    }

    return counts;
  });

  const result = insertAll();
  console.log(`  ${patient.full_name} <${patient.email}>`);
  console.log(`     glucose:${result.glucose}  meals:${result.meals}  meds:${result.meds}  activities:${result.activities}  feelings:${result.feelings}`);
}

// ---------- main ----------
const patients = db.prepare("SELECT id, email, full_name FROM profiles WHERE role = 'patient'").all();

console.log(`Seeding ${DAYS} days of fake health data for ${patients.length} patients...\n`);
for (const p of patients) seedPatient(p);

console.log('\nDone. Refresh the app to see the new data.');
db.close();
