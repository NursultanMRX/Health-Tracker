import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'diabetes.db'));

// Find a patient user
const patient = db.prepare(`
  SELECT id, email, full_name FROM profiles WHERE role = 'patient' LIMIT 1
`).get();

if (!patient) {
  console.error('No patient user found! Please create a patient account first.');
  process.exit(1);
}

console.log(`Found patient: ${patient.full_name} (${patient.email})`);
console.log(`User ID: ${patient.id}`);

// Create notification settings if they don't exist
const existingSettings = db.prepare(`
  SELECT id FROM user_notification_settings WHERE user_id = ?
`).get(patient.id);

if (!existingSettings) {
  db.prepare(`
    INSERT INTO user_notification_settings (
      id, user_id, preferred_language, reminder_time, timezone, enabled_notifications
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    patient.id,
    'en',
    '09:00',
    'UTC',
    '{"critical":true,"warnings":true,"reminders":true,"positive":true}'
  );
  console.log('✓ Created notification settings');
} else {
  console.log('✓ Notification settings already exist');
}

// Create test notifications
const notifications = [
  {
    type: 'glucoseSpikeCritical',
    hoursAgo: 2,
    metadata: { value: 350, mock: true }
  },
  {
    type: 'highRiskCritical',
    hoursAgo: 5,
    metadata: { mock: true }
  },
  {
    type: 'consistentHighWarning',
    hoursAgo: 24,
    metadata: { mock: true }
  },
  {
    type: 'logDataReminder',
    hoursAgo: 3,
    metadata: { mock: true }
  },
  {
    type: 'positiveReinforcement',
    hoursAgo: 48,
    metadata: { mock: true }
  },
  {
    type: 'patternDetectedTip',
    hoursAgo: 24,
    metadata: { mock: true }
  }
];

// Clear existing test notifications
db.prepare(`
  DELETE FROM notifications_log WHERE user_id = ? AND json_extract(metadata, '$.mock') = 1
`).run(patient.id);

// Insert test notifications
for (const notif of notifications) {
  const triggeredAt = new Date(Date.now() - notif.hoursAgo * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO notifications_log (id, user_id, notification_type, triggered_at, sent_status, metadata)
    VALUES (?, ?, ?, ?, 'sent', ?)
  `).run(
    uuidv4(),
    patient.id,
    notif.type,
    triggeredAt,
    JSON.stringify(notif.metadata)
  );
}

console.log(`✓ Created ${notifications.length} test notifications`);

// Show notification count
const count = db.prepare(`
  SELECT COUNT(*) as count FROM notifications_log WHERE user_id = ?
`).get(patient.id);

console.log(`Total notifications for ${patient.full_name}: ${count.count}`);
console.log('\n✓ Done! You can now log in as this user and see the notifications.');
console.log(`  Email: ${patient.email}`);

db.close();
