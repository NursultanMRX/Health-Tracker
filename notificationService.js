import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cooldown periods in milliseconds
const COOLDOWN_PERIODS = {
  highRiskCritical: 7 * 24 * 60 * 60 * 1000,      // 7 days
  glucoseSpikeCritical: 3 * 60 * 60 * 1000,       // 3 hours
  consistentHighWarning: 5 * 24 * 60 * 60 * 1000, // 5 days
  logDataReminder: 24 * 60 * 60 * 1000,           // 24 hours
  positiveReinforcement: 7 * 24 * 60 * 60 * 1000, // 7 days
  patternDetectedTip: 14 * 24 * 60 * 60 * 1000    // 14 days
};

// Initialize Firebase Admin (only if credentials are available)
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return true;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      path.join(__dirname, 'firebase-service-account.json');

    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseInitialized = true;
    console.log('✓ Firebase Admin initialized');
    return true;
  } catch (error) {
    console.warn('⚠ Firebase Admin not initialized:', error.message);
    console.warn('  Push notifications will be logged but not sent');
    return false;
  }
}

// Load translations
function loadTranslations() {
  const translations = {};
  const languages = ['en', 'ru', 'kaa'];

  for (const lang of languages) {
    try {
      const filePath = path.join(__dirname, 'src', 'locales', lang, 'translation.json');
      translations[lang] = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.error(`Failed to load ${lang} translations:`, error.message);
      translations[lang] = {};
    }
  }

  return translations;
}

const translations = loadTranslations();

// Get translated notification content
function getNotificationContent(notificationType, language, data = {}) {
  const lang = language || 'en';
  const fallbackLang = 'en';

  const translation = translations[lang]?.notifications?.[notificationType] ||
                      translations[fallbackLang]?.notifications?.[notificationType] ||
                      { title: 'Notification', body: 'You have a new notification' };

  // Interpolate variables (e.g., {{value}} -> actual value)
  let title = translation.title;
  let body = translation.body;

  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    title = title.replace(regex, data[key]);
    body = body.replace(regex, data[key]);
  });

  return { title, body };
}

// Check if notification can be sent (cooldown logic)
async function canSendNotification(db, userId, notificationType) {
  const cooldownPeriod = COOLDOWN_PERIODS[notificationType];

  if (!cooldownPeriod) {
    console.warn(`Unknown notification type: ${notificationType}`);
    return false;
  }

  const lastSent = db.prepare(`
    SELECT triggered_at FROM notifications_log
    WHERE user_id = ? AND notification_type = ?
    ORDER BY triggered_at DESC LIMIT 1
  `).get(userId, notificationType);

  if (!lastSent) return true;

  const timeSince = Date.now() - new Date(lastSent.triggered_at).getTime();
  return timeSince >= cooldownPeriod;
}

// Send push notification via FCM
async function sendPushNotification(db, userId, notificationType, data = {}) {
  try {
    // Get user notification settings
    const settings = db.prepare(`
      SELECT fcm_token, preferred_language, enabled_notifications
      FROM user_notification_settings
      WHERE user_id = ?
    `).get(userId);

    if (!settings) {
      console.log(`No notification settings for user ${userId}`);
      return { success: false, reason: 'no_settings' };
    }

    // Check if this notification type is enabled
    const enabledNotifications = JSON.parse(settings.enabled_notifications || '{}');
    const notificationCategory = getNotificationCategory(notificationType);

    if (!enabledNotifications[notificationCategory]) {
      console.log(`Notification type ${notificationCategory} disabled for user ${userId}`);
      return { success: false, reason: 'disabled' };
    }

    if (!settings.fcm_token) {
      console.log(`No FCM token for user ${userId}`);
      return { success: false, reason: 'no_token' };
    }

    // Check cooldown
    if (!(await canSendNotification(db, userId, notificationType))) {
      console.log(`Cooldown active for ${notificationType} for user ${userId}`);
      return { success: false, reason: 'cooldown' };
    }

    // Get localized content
    const { title, body } = getNotificationContent(
      notificationType,
      settings.preferred_language,
      data
    );

    console.log(`Sending notification to user ${userId}: ${title}`);

    // Send via FCM if initialized
    if (firebaseInitialized) {
      const message = {
        token: settings.fcm_token,
        notification: { title, body },
        data: {
          type: notificationType,
          ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
        },
        android: {
          priority: notificationType.includes('Critical') ? 'high' : 'normal'
        },
        apns: {
          payload: {
            aps: {
              sound: notificationType.includes('Critical') ? 'critical.wav' : 'default'
            }
          }
        }
      };

      const response = await admin.messaging().send(message);

      // Log successful notification
      db.prepare(`
        INSERT INTO notifications_log (id, user_id, notification_type, sent_status, metadata)
        VALUES (?, ?, ?, 'sent', ?)
      `).run(uuidv4(), userId, notificationType, JSON.stringify(data));

      return { success: true, messageId: response };
    } else {
      // Log notification without sending (Firebase not configured)
      console.log(`[MOCK] Notification: ${title} - ${body}`);

      db.prepare(`
        INSERT INTO notifications_log (id, user_id, notification_type, sent_status, metadata)
        VALUES (?, ?, ?, 'sent', ?)
      `).run(uuidv4(), userId, notificationType, JSON.stringify({ ...data, mock: true }));

      return { success: true, mock: true };
    }
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);

    // Log failed notification
    db.prepare(`
      INSERT INTO notifications_log (id, user_id, notification_type, sent_status, metadata)
      VALUES (?, ?, ?, 'failed', ?)
    `).run(uuidv4(), userId, notificationType, JSON.stringify({ error: error.message }));

    return { success: false, error: error.message };
  }
}

// Get notification category for settings check
function getNotificationCategory(notificationType) {
  if (notificationType.includes('Critical')) return 'critical';
  if (notificationType.includes('Warning')) return 'warnings';
  if (notificationType.includes('Reminder')) return 'reminders';
  if (notificationType.includes('Reinforcement') || notificationType.includes('Tip')) return 'positive';
  return 'critical'; // Default to critical
}

// TRIGGER LOGIC FUNCTIONS

// Check for high risk users (diabetes_risk > 90)
async function checkHighRiskUsers(db) {
  console.log('Checking for high risk users...');

  const query = `
    SELECT DISTINCT hm.patient_id, uns.preferred_language
    FROM health_metrics hm
    JOIN user_notification_settings uns ON hm.patient_id = uns.user_id
    WHERE hm.risk_probability > 0.90
    AND hm.id IN (
      SELECT id FROM health_metrics hm2
      WHERE hm2.patient_id = hm.patient_id
      ORDER BY hm2.timestamp DESC LIMIT 1
    )
    AND NOT EXISTS (
      SELECT 1 FROM notifications_log
      WHERE user_id = hm.patient_id
      AND notification_type = 'highRiskCritical'
      AND triggered_at > datetime('now', '-7 days')
    )
  `;

  const users = db.prepare(query).all();

  for (const user of users) {
    await sendPushNotification(db, user.patient_id, 'highRiskCritical');
  }

  console.log(`✓ Checked ${users.length} high risk users`);
  return users.length;
}

// Check for critical glucose spikes (>= 300 mg/dL)
async function checkCriticalGlucose(db) {
  console.log('Checking for critical glucose levels...');

  const query = `
    SELECT g.patient_id, g.value_mg_dl, uns.preferred_language
    FROM glucose_readings g
    JOIN user_notification_settings uns ON g.patient_id = uns.user_id
    WHERE g.value_mg_dl >= 300
    AND g.timestamp > datetime('now', '-30 minutes')
    AND NOT EXISTS (
      SELECT 1 FROM notifications_log
      WHERE user_id = g.patient_id
      AND notification_type = 'glucoseSpikeCritical'
      AND triggered_at > datetime('now', '-3 hours')
    )
  `;

  const readings = db.prepare(query).all();

  for (const reading of readings) {
    await sendPushNotification(
      db,
      reading.patient_id,
      'glucoseSpikeCritical',
      { value: reading.value_mg_dl }
    );
  }

  console.log(`✓ Checked ${readings.length} critical glucose readings`);
  return readings.length;
}

// Check for consistent high glucose (avg > 180 for 3 days)
async function checkConsistentHighGlucose(db) {
  console.log('Checking for consistent high glucose...');

  const query = `
    WITH daily_averages AS (
      SELECT
        patient_id,
        DATE(timestamp) as date,
        AVG(value_mg_dl) as avg_glucose
      FROM glucose_readings
      WHERE timestamp > datetime('now', '-3 days')
      GROUP BY patient_id, DATE(timestamp)
    ),
    high_days AS (
      SELECT patient_id, COUNT(*) as high_day_count
      FROM daily_averages
      WHERE avg_glucose > 180
      GROUP BY patient_id
    )
    SELECT DISTINCT hd.patient_id, uns.preferred_language
    FROM high_days hd
    JOIN user_notification_settings uns ON hd.patient_id = uns.user_id
    WHERE hd.high_day_count >= 3
    AND NOT EXISTS (
      SELECT 1 FROM notifications_log
      WHERE user_id = hd.patient_id
      AND notification_type = 'consistentHighWarning'
      AND triggered_at > datetime('now', '-5 days')
    )
  `;

  const users = db.prepare(query).all();

  for (const user of users) {
    await sendPushNotification(db, user.patient_id, 'consistentHighWarning');
  }

  console.log(`✓ Checked ${users.length} users with consistent high glucose`);
  return users.length;
}

// Check for users who need reminders to log data
async function checkLogReminders(db) {
  console.log('Checking for log reminders...');

  const query = `
    SELECT DISTINCT p.id as patient_id, uns.preferred_language
    FROM profiles p
    JOIN user_notification_settings uns ON p.id = uns.user_id
    WHERE p.role = 'patient'
    AND uns.enabled_notifications LIKE '%"reminders":true%'
    AND NOT EXISTS (
      SELECT 1 FROM glucose_readings
      WHERE patient_id = p.id AND timestamp > datetime('now', '-24 hours')
    )
    AND NOT EXISTS (
      SELECT 1 FROM meals
      WHERE patient_id = p.id AND timestamp > datetime('now', '-24 hours')
    )
    AND NOT EXISTS (
      SELECT 1 FROM notifications_log
      WHERE user_id = p.id
      AND notification_type = 'logDataReminder'
      AND triggered_at > datetime('now', '-24 hours')
    )
  `;

  const users = db.prepare(query).all();

  for (const user of users) {
    await sendPushNotification(db, user.patient_id, 'logDataReminder');
  }

  console.log(`✓ Sent ${users.length} log reminders`);
  return users.length;
}

// Check for positive reinforcement (good glucose control)
async function checkPositiveReinforcement(db) {
  console.log('Checking for positive reinforcement...');

  const query = `
    WITH weekly_stats AS (
      SELECT
        patient_id,
        AVG(value_mg_dl) as avg_glucose,
        COUNT(*) as reading_count
      FROM glucose_readings
      WHERE timestamp > datetime('now', '-7 days')
      GROUP BY patient_id
    )
    SELECT DISTINCT ws.patient_id, uns.preferred_language
    FROM weekly_stats ws
    JOIN user_notification_settings uns ON ws.patient_id = uns.user_id
    WHERE ws.avg_glucose BETWEEN 80 AND 130
    AND ws.reading_count >= 14
    AND NOT EXISTS (
      SELECT 1 FROM notifications_log
      WHERE user_id = ws.patient_id
      AND notification_type = 'positiveReinforcement'
      AND triggered_at > datetime('now', '-7 days')
    )
  `;

  const users = db.prepare(query).all();

  for (const user of users) {
    await sendPushNotification(db, user.patient_id, 'positiveReinforcement');
  }

  console.log(`✓ Sent ${users.length} positive reinforcement notifications`);
  return users.length;
}

// Check for dinner spike patterns
async function checkDinnerSpikePattern(db) {
  console.log('Checking for dinner spike patterns...');

  // This is a simplified version - in production, you'd want more sophisticated pattern detection
  const query = `
    WITH dinner_readings AS (
      SELECT
        patient_id,
        DATE(timestamp) as date,
        AVG(value_mg_dl) as avg_glucose
      FROM glucose_readings
      WHERE CAST(strftime('%H', timestamp) AS INTEGER) BETWEEN 19 AND 22
      AND timestamp > datetime('now', '-7 days')
      GROUP BY patient_id, DATE(timestamp)
    ),
    spike_days AS (
      SELECT patient_id, COUNT(*) as spike_count
      FROM dinner_readings
      WHERE avg_glucose > 200
      GROUP BY patient_id
    )
    SELECT DISTINCT sd.patient_id, uns.preferred_language
    FROM spike_days sd
    JOIN user_notification_settings uns ON sd.patient_id = uns.user_id
    WHERE sd.spike_count >= 4
    AND NOT EXISTS (
      SELECT 1 FROM notifications_log
      WHERE user_id = sd.patient_id
      AND notification_type = 'patternDetectedTip'
      AND triggered_at > datetime('now', '-14 days')
    )
  `;

  const users = db.prepare(query).all();

  for (const user of users) {
    await sendPushNotification(db, user.patient_id, 'patternDetectedTip');
  }

  console.log(`✓ Checked ${users.length} users for dinner spike patterns`);
  return users.length;
}

// Export all functions
export {
  initializeFirebase,
  sendPushNotification,
  checkHighRiskUsers,
  checkCriticalGlucose,
  checkConsistentHighGlucose,
  checkLogReminders,
  checkPositiveReinforcement,
  checkDinnerSpikePattern
};
