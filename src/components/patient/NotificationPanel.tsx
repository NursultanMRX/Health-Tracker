import { useEffect, useState } from 'react';
import { X, Bell, Settings, AlertTriangle, TrendingUp, Heart, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../lib/config';

interface Notification {
  id: string;
  notification_type: string;
  triggered_at: string;
  sent_status: string;
  metadata: any;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsClick: () => void;
}

const getNotificationIcon = (type: string) => {
  if (type.includes('Critical')) return (
    <div className="p-2 bg-red-100 rounded-full">
      <AlertTriangle className="w-4 h-4 text-red-600" />
    </div>
  );
  if (type.includes('Warning')) return (
    <div className="p-2 bg-orange-100 rounded-full">
      <TrendingUp className="w-4 h-4 text-orange-600" />
    </div>
  );
  if (type.includes('Reminder')) return (
    <div className="p-2 bg-blue-100 rounded-full">
      <Info className="w-4 h-4 text-blue-600" />
    </div>
  );
  if (type.includes('Reinforcement') || type.includes('Tip')) return (
    <div className="p-2 bg-green-100 rounded-full">
      <Heart className="w-4 h-4 text-green-600" />
    </div>
  );
  return (
    <div className="p-2 bg-gray-100 rounded-full">
      <Bell className="w-4 h-4 text-gray-600" />
    </div>
  );
};

const getNotificationColor = (type: string) => {
  if (type.includes('Critical')) return 'border-red-200 hover:border-red-300';
  if (type.includes('Warning')) return 'border-orange-200 hover:border-orange-300';
  if (type.includes('Reminder')) return 'border-blue-200 hover:border-blue-300';
  if (type.includes('Reinforcement') || type.includes('Tip')) return 'border-green-200 hover:border-green-300';
  return 'border-gray-200 hover:border-gray-300';
};

export default function NotificationPanel({ isOpen, onClose, onSettingsClick }: NotificationPanelProps) {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/notifications/history?limit=20'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'ru-RU', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-full">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all hover:scale-105"
              aria-label="Notification settings"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all hover:scale-105"
              aria-label="Close"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-6">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Bell className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-base font-medium text-gray-700">No notifications yet</p>
              <p className="text-sm mt-2 text-center text-gray-500">You'll see your health alerts and reminders here</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => {
                // Get translated notification content
                const notificationKey = `notifications.${notification.notification_type}`;
                const title = t(`${notificationKey}.title`, { defaultValue: notification.notification_type });
                const body = t(`${notificationKey}.body`, {
                  ...notification.metadata,
                  defaultValue: 'Notification'
                });

                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${getNotificationColor(notification.notification_type)} bg-white`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm mb-1.5 leading-tight">
                          {title}
                        </p>
                        <p className="text-gray-700 text-sm leading-relaxed mb-3">
                          {body}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-gray-500">
                            {formatTime(notification.triggered_at)}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {notification.metadata?.mock && (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md font-medium">
                                Test
                              </span>
                            )}
                            {notification.sent_status === 'failed' && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md font-medium">
                                Failed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-white">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Bell className="w-3.5 h-3.5" />
            <p>Notifications help you stay on top of your health</p>
          </div>
        </div>
      </div>
    </>
  );
}
