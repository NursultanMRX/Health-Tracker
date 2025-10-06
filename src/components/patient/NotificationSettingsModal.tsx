import { useState, useEffect } from 'react';
import { X, Bell, BellOff, AlertTriangle, TrendingUp, Info, Heart } from 'lucide-react';
import { buildApiUrl } from '../lib/config';

interface NotificationSettings {
  preferred_language: string;
  reminder_time: string;
  timezone: string;
  enabled_notifications: {
    critical: boolean;
    warnings: boolean;
    reminders: boolean;
    positive: boolean;
  };
}

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    preferred_language: 'en',
    reminder_time: '09:00',
    timezone: 'UTC',
    enabled_notifications: {
      critical: true,
      warnings: true,
      reminders: true,
      positive: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/notifications/settings'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(buildApiUrl('/notifications/settings'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        onClose();
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotificationType = (type: keyof NotificationSettings['enabled_notifications']) => {
    setSettings(prev => ({
      ...prev,
      enabled_notifications: {
        ...prev.enabled_notifications,
        [type]: !prev.enabled_notifications[type],
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Notification Types */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Notification Types</h3>
                <div className="space-y-3">
                  {/* Critical */}
                  <button
                    onClick={() => toggleNotificationType('critical')}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Critical Alerts</p>
                        <p className="text-xs text-gray-500">High glucose & diabetes risk</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.enabled_notifications.critical ? 'bg-blue-500' : 'bg-gray-300'
                    } relative`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.enabled_notifications.critical ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </button>

                  {/* Warnings */}
                  <button
                    onClick={() => toggleNotificationType('warnings')}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Warnings</p>
                        <p className="text-xs text-gray-500">Trends & patterns</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.enabled_notifications.warnings ? 'bg-blue-500' : 'bg-gray-300'
                    } relative`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.enabled_notifications.warnings ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </button>

                  {/* Reminders */}
                  <button
                    onClick={() => toggleNotificationType('reminders')}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-blue-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Reminders</p>
                        <p className="text-xs text-gray-500">Daily log reminders</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.enabled_notifications.reminders ? 'bg-blue-500' : 'bg-gray-300'
                    } relative`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.enabled_notifications.reminders ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </button>

                  {/* Positive */}
                  <button
                    onClick={() => toggleNotificationType('positive')}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-green-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Encouragement</p>
                        <p className="text-xs text-gray-500">Positive reinforcement & tips</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.enabled_notifications.positive ? 'bg-blue-500' : 'bg-gray-300'
                    } relative`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.enabled_notifications.positive ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Reminder Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Daily Reminder Time
                </label>
                <input
                  type="time"
                  value={settings.reminder_time}
                  onChange={(e) => setSettings({ ...settings, reminder_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When you'd like to receive daily log reminders
                </p>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notification Language
                </label>
                <select
                  value={settings.preferred_language}
                  onChange={(e) => setSettings({ ...settings, preferred_language: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="kaa">Qaraqalpaqsha</option>
                  <option value="uz">O'zbek tili</option>
                </select>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Push notifications help you:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Stay on top of critical health events</li>
                      <li>Remember to log your daily data</li>
                      <li>Track patterns in your glucose levels</li>
                      <li>Celebrate your progress</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || loading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
