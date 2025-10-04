import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'diabetes.db'));

async function addCriticalPatients() {
  const criticalPatients = [
    {
      email: 'sarah.johnson@test.com',
      password: 'patient123456',
      fullName: 'Sarah Johnson',
      age: 52,
      sex: 'female',
      condition: 'critical'
    },
    {
      email: 'michael.chen@test.com',
      password: 'patient123456',
      fullName: 'Michael Chen',
      age: 45,
      sex: 'male',
      condition: 'critical'
    },
    {
      email: 'david.miller@test.com',
      password: 'patient123456',
      fullName: 'David Miller',
      age: 58,
      sex: 'male',
      condition: 'critical'
    }
  ];

  for (const patient of criticalPatients) {
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(patient.password, 10);

    try {
      // Insert patient profile
      db.prepare(`
        INSERT INTO profiles (id, email, password_hash, full_name, role, age, sex, created_at)
        VALUES (?, ?, ?, ?, 'patient', ?, ?, datetime('now'))
      `).run(userId, patient.email, passwordHash, patient.fullName, patient.age, patient.sex);

      console.log(`✓ Created patient: ${patient.fullName}`);

      // Create patient settings
      const settingsId = uuidv4();
      db.prepare(`
        INSERT INTO patient_settings (id, patient_id)
        VALUES (?, ?)
      `).run(settingsId, userId);

      // Add critical glucose readings (very high and very low values)
      const now = new Date();
      for (let day = 0; day < 30; day++) {
        for (let reading = 0; reading < 4; reading++) {
          const timestamp = new Date(now);
          timestamp.setDate(timestamp.getDate() - day);

          // Set different times for readings
          const hours = [7, 12, 18, 22][reading];
          timestamp.setHours(hours, 0, 0, 0);

          // Generate critical glucose values (very low <60 or very high >250)
          let glucoseValue;
          if (Math.random() > 0.6) {
            // 40% chance of dangerously high
            glucoseValue = Math.floor(Math.random() * 100) + 250; // 250-350
          } else if (Math.random() > 0.5) {
            // 30% chance of dangerously low
            glucoseValue = Math.floor(Math.random() * 15) + 45; // 45-60
          } else {
            // 30% chance of moderately out of range
            glucoseValue = Math.floor(Math.random() * 50) + 200; // 200-250
          }

          const types = ['fasting', 'prebreakfast', 'postbreakfast', 'prelunch', 'postlunch', 'predinner', 'postdinner', 'bedtime'];
          const type = types[Math.floor(Math.random() * types.length)];

          db.prepare(`
            INSERT INTO glucose_readings (id, patient_id, timestamp, value_mg_dl, measurement_type)
            VALUES (?, ?, ?, ?, ?)
          `).run(uuidv4(), userId, timestamp.toISOString(), glucoseValue, type);
        }
      }

      // Add clinical alert for critical condition
      const alertId = uuidv4();
      const alertMessages = [
        'Frequent hypoglycemic episodes detected',
        'Severe hyperglycemia - immediate attention required',
        'Dangerously unstable glucose levels',
        'Multiple critical readings in past 24 hours'
      ];

      db.prepare(`
        INSERT INTO clinical_alerts (id, patient_id, alert_type, severity, message, status, created_at)
        VALUES (?, ?, 'glucose_critical', 'high', ?, 'active', datetime('now'))
      `).run(alertId, userId, alertMessages[Math.floor(Math.random() * alertMessages.length)]);

      console.log(`  ✓ Added 120 critical glucose readings`);
      console.log(`  ✓ Added critical alert`);

    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log(`⚠ Patient ${patient.email} already exists, skipping...`);
      } else {
        console.error(`✗ Error creating ${patient.fullName}:`, error.message);
      }
    }
  }

  db.close();
  console.log('\n✓ Done adding critical patients!');
}

addCriticalPatients();
