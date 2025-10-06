-- Test script to populate sample notifications
-- This will help you see notifications in the UI

-- First, get a patient user ID (replace with actual user ID from your database)
-- You can find this by running: SELECT id, email FROM profiles WHERE role='patient';

-- For this example, let's assume your user ID is stored in a variable
-- Replace 'YOUR_USER_ID_HERE' with an actual patient user ID from your database

-- Create notification settings for the user
INSERT OR IGNORE INTO user_notification_settings (
  id, user_id, preferred_language, reminder_time, timezone, enabled_notifications
) VALUES (
  'test-settings-1',
  'YOUR_USER_ID_HERE',  -- Replace this!
  'en',
  '09:00',
  'UTC',
  '{"critical":true,"warnings":true,"reminders":true,"positive":true}'
);

-- Add sample notifications
INSERT INTO notifications_log (id, user_id, notification_type, triggered_at, sent_status, metadata)
VALUES
  -- Critical: High glucose spike
  (
    'test-notif-1',
    'YOUR_USER_ID_HERE',  -- Replace this!
    'glucoseSpikeCritical',
    datetime('now', '-2 hours'),
    'sent',
    '{"value": 350, "mock": true}'
  ),

  -- Warning: Consistent high glucose
  (
    'test-notif-2',
    'YOUR_USER_ID_HERE',  -- Replace this!
    'consistentHighWarning',
    datetime('now', '-1 day'),
    'sent',
    '{"mock": true}'
  ),

  -- Reminder: Log data
  (
    'test-notif-3',
    'YOUR_USER_ID_HERE',  -- Replace this!
    'logDataReminder',
    datetime('now', '-3 hours'),
    'sent',
    '{"mock": true}'
  ),

  -- Positive: Good glucose control
  (
    'test-notif-4',
    'YOUR_USER_ID_HERE',  -- Replace this!
    'positiveReinforcement',
    datetime('now', '-2 days'),
    'sent',
    '{"mock": true}'
  ),

  -- Tip: Pattern detected
  (
    'test-notif-5',
    'YOUR_USER_ID_HERE',  -- Replace this!
    'patternDetectedTip',
    datetime('now', '-1 day'),
    'sent',
    '{"mock": true}'
  ),

  -- Critical: High diabetes risk
  (
    'test-notif-6',
    'YOUR_USER_ID_HERE',  -- Replace this!
    'highRiskCritical',
    datetime('now', '-5 hours'),
    'sent',
    '{"mock": true}'
  );

SELECT 'Sample notifications created successfully!' as result;
SELECT COUNT(*) as notification_count FROM notifications_log WHERE user_id = 'YOUR_USER_ID_HERE';
