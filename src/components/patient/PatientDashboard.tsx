import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { GlucoseReading } from '../../lib/types';
import { calculateTIR, calculateAverage, getDaysAgo } from '../../lib/utils';
import { Droplets, Utensils, Activity as ActivityIcon, Pill, Heart, Plus, Settings, LogOut, TrendingUp, Calendar, Bell, User, Smile, Shield, Mic } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AddGlucoseModal from './modals/AddGlucoseModal';
import AddMealModal from './modals/AddMealModal';
import AddActivityModal from './modals/AddActivityModal';
import AddMedicationModal from './modals/AddMedicationModal';
import AddFeelingModal from './modals/AddFeelingModal';
import AddHealthMetricsModal from './modals/AddHealthMetricsModal';
import VoiceInputModal from './modals/VoiceInputModal';
import DailyLogList from './DailyLogList';
import PatientCharts from './PatientCharts';
import PatientSettings from './PatientSettings';
import GlucoseChart from './GlucoseChart';
import ProfileDropdown from '../common/ProfileDropdown';
import NotificationPanel from './NotificationPanel';
import NotificationSettingsModal from './NotificationSettingsModal';
import { buildApiUrl } from '../../lib/config';

type ModalType = 'glucose' | 'meal' | 'activity' | 'medication' | 'feeling' | 'health_metrics' | 'settings' | 'voice_input' | null;

// Translation helper for ML API responses
const translateRiskLevel = (level: string): string => {
  const translations: { [key: string]: string } = {
    'Past': 'Low',
    'O\'rta': 'Medium',
    'Yuqori': 'High',
  };
  return translations[level] || level;
};

const translateRecommendation = (recommendation: string): string => {
  const translations: { [key: string]: string } = {
    "Sizning diabet riskingiz past. Sog'lom turmush tarzini davom ettiring!":
      "Your diabetes risk is low. Continue maintaining a healthy lifestyle!",
    "Sizning diabet riskingiz o'rtacha. Shifokor bilan maslahatlashing va ovqatlanishni nazorat qiling.":
      "Your diabetes risk is moderate. Consult with a doctor and monitor your diet carefully.",
    "Sizning diabet riskingiz yuqori! Zudlik bilan shifokorga murojaat qiling.":
      "Your diabetes risk is high! Please consult a doctor immediately.",
    "Sizning diabet riskingiz yuqori! Zudlik bilan shifokorga murojaat qiling va to'liq tekshiruvdan o'ting.":
      "Your diabetes risk is high! Please consult a doctor immediately and get a complete checkup.",
  };
  return translations[recommendation] || recommendation;
};

export default function PatientDashboard() {
  const { user, profile, signOut } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'log' | 'charts'>('dashboard');
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMealType, setSelectedMealType] = useState<string>('breakfast');
  const [latestRisk, setLatestRisk] = useState<any>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [voiceExtractedData, setVoiceExtractedData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadReadings();
      loadLatestRisk();
      loadNotificationCount();
    }
  }, [user]);

  const loadNotificationCount = async () => {
    try {
      const response = await fetch(buildApiUrl('/notifications/history?limit=100'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Count notifications from last 7 days
        const recentCount = data.filter((n: any) => {
          const notifDate = new Date(n.triggered_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return notifDate > weekAgo;
        }).length;
        setNotificationCount(recentCount);
      }
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const loadLatestRisk = async () => {
    try {
      const response = await fetch(buildApiUrl('/health-metrics?patient_id=${user?.id}'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const metrics = await response.json();
        if (metrics.length > 0 && metrics[0].risk_percentage) {
          setLatestRisk(metrics[0]);
        }
      }
    } catch (error) {
      console.error('Error loading risk data:', error);
    }
  };


  const loadReadings = async () => {
    try {
      const thirtyDaysAgo = getDaysAgo(30);
      const response = await fetch(buildApiUrl('/glucose-readings?patient_id=${user?.id}&start_date=${thirtyDaysAgo.toISOString()}'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load readings');
      }

      const data = await response.json();
      // Sort by timestamp descending (newest first)
      const sortedData = (data || []).sort((a: GlucoseReading, b: GlucoseReading) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setReadings(sortedData);
    } catch (error) {
      console.error('Error loading readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = () => {
    loadReadings();
    loadLatestRisk();
    setActiveModal(null);
  };

  const handleVoiceDataExtracted = (data: any) => {
    console.log('Voice data extracted:', data);
    setVoiceExtractedData(data);
    // Open health metrics modal with the extracted data
    setActiveModal('health_metrics');
  };

  const handleMealTypeSelect = (mealType: string) => {
    setSelectedMealType(mealType);
    // Open glucose modal with pre-selected meal type
    setActiveModal('glucose');
  };

  const latestReading = readings[0];
  // Calculate 7-day average from the 30-day dataset
  const sevenDayReadings = readings.filter(r => {
    const daysDiff = (new Date().getTime() - new Date(r.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  });
  const avgGlucose = calculateAverage(sevenDayReadings);
  const tir = calculateTIR(sevenDayReadings, settings?.target_low || 70, settings?.target_high || 180);

  const quickActions = [
    { id: 'glucose', icon: Droplets, label: 'Log Glucose', color: 'bg-red-500', modal: 'glucose' as const },
    { id: 'meal', icon: Utensils, label: 'Log Meal', color: 'bg-orange-500', modal: 'meal' as const },
    { id: 'activity', icon: ActivityIcon, label: 'Log Activity', color: 'bg-green-500', modal: 'activity' as const },
    { id: 'medication', icon: Pill, label: 'Log Medicine', color: 'bg-blue-500', modal: 'medication' as const },
    { id: 'feeling', icon: Heart, label: 'How are you feeling?', color: 'bg-pink-500', modal: 'feeling' as const },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your health data...</p>
        </div>
      </div>
    );
  }

  // Determine glucose status for welcoming message
  const getGlucoseStatus = () => {
    if (!latestReading) return 'unknown';
    const value = latestReading.value_mg_dl;
    if (value < 70) return 'low';
    if (value > 180) return 'high';
    return 'normal';
  };

  const glucoseStatus = getGlucoseStatus();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 ${settings?.large_text_enabled ? 'text-lg' : ''}`}>
      {/* Welcoming Header - Personal Health Companion feel */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 py-6">
          {/* Greeting and Profile */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('helloUser', { name: profile?.full_name?.split(' ')[0] || 'there' })}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsNotificationPanelOpen(true);
                  setNotificationCount(0); // Reset count when opened
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              <ProfileDropdown onSettingsClick={() => setActiveModal('settings')} />
            </div>
          </div>

          {/* Prominent Current Glucose Display - Very clear and easy to understand */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-blue-100 text-sm font-medium mb-2">{t('yourCurrentGlucose')}</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-white text-5xl font-bold">
                    {latestReading ? latestReading.value_mg_dl : '--'}
                  </p>
                  <span className="text-blue-100 text-xl font-medium">{t('mgdl')}</span>
                </div>
                {latestReading && (
                  <p className="text-blue-100 text-xs mt-2">
                    {t('lastUpdated')}: {new Date(latestReading.timestamp).toLocaleString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* View Switcher - Moved to header for better navigation */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                activeView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
              }`}
            >
              {t('dashboard')}
            </button>
            {!profile?.assigned_doctor_id && (
              <button
                onClick={() => setActiveView('charts')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  activeView === 'charts'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
                }`}
              >
                {t('charts')}
              </button>
            )}
            <button
              onClick={() => setActiveView('log')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                activeView === 'log'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
              }`}
            >
              {t('history')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {activeView === 'dashboard' && (
          <div className="space-y-8">
            {/* Diabetes Risk Assessment */}
            {latestRisk && (() => {
              const riskLevel = translateRiskLevel(latestRisk.risk_level);
              let bgColor = 'from-purple-50 to-purple-100';
              let borderColor = 'border-purple-200';
              let textColor = 'text-purple-900';
              let valueColor = 'text-purple-700';
              let iconColor = 'text-purple-600';

              if (riskLevel === 'High') {
                bgColor = 'from-red-50 to-red-100';
                borderColor = 'border-red-200';
                textColor = 'text-red-900';
                valueColor = 'text-red-700';
                iconColor = 'text-red-600';
              } else if (riskLevel === 'Medium') {
                bgColor = 'from-yellow-50 to-yellow-100';
                borderColor = 'border-yellow-200';
                textColor = 'text-yellow-900';
                valueColor = 'text-yellow-700';
                iconColor = 'text-yellow-600';
              } else if (riskLevel === 'Low') {
                bgColor = 'from-green-50 to-green-100';
                borderColor = 'border-green-200';
                textColor = 'text-green-900';
                valueColor = 'text-green-700';
                iconColor = 'text-green-600';
              }

              return (
                <div className={`bg-gradient-to-br ${bgColor} rounded-2xl p-6 shadow-sm border ${borderColor} mb-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-semibold ${textColor} mb-2`}>Diabetes Risk Assessment</h3>
                      <p className={`text-5xl font-bold ${valueColor}`}>{latestRisk.risk_percentage}</p>
                      <p className={`text-sm ${textColor} mt-1`}>Risk Level: <span className="font-semibold">{riskLevel}</span></p>
                      <p className={`text-sm ${textColor} mt-3 italic`}>{translateRecommendation(latestRisk.recommendation)}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center w-24 h-24 bg-white/50 rounded-full backdrop-blur-sm">
                      <Shield className={`w-12 h-12 ${iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Summary Section - Simple cards with key metrics */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('yourHealthSummary')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Time in Range Card - Motivating progress indicator */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-sm p-6 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-green-900">{t('timeInRange')}</p>
                  </div>
                  <p className="text-4xl font-bold text-green-700 mb-1">{tir}%</p>
                  <p className="text-xs text-green-700">{t('lastDays', { count: 7 })} • {t('targetRange', { low: 70, high: 180 })}</p>
                  {/* Simple progress bar */}
                  <div className="mt-4 h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${tir}%` }}
                    />
                  </div>
                </div>

                {/* Average Glucose Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-sm p-6 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-blue-900">{t('averageGlucose')}</p>
                  </div>
                  <p className="text-4xl font-bold text-blue-700 mb-1">
                    {avgGlucose || '--'}
                  </p>
                  <p className="text-xs text-blue-700">{t('lastDays', { count: 7 })} • {t('mgdl')}</p>
                </div>

                {/* Recent Activity Card */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-sm p-6 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-purple-900">{t('totalLogs')}</p>
                  </div>
                  <p className="text-4xl font-bold text-purple-700 mb-1">{readings.length}</p>
                  <p className="text-xs text-purple-700">{t('lastDays', { count: 30 })}</p>
                </div>
              </div>
            </div>

            {/* Input Area - Simple, user-friendly form/buttons to log new data */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('logYourData')}</h2>

              {/* Voice Input Button - NEW Feature */}
              <button
                onClick={() => setActiveModal('voice_input')}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl p-6 flex items-center justify-center gap-3 text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl mb-4"
              >
                <Mic className="w-6 h-6" />
                {t('useVoiceToLogData')}
              </button>

              {/* Comprehensive Health Metrics Button - Primary action */}
              <button
                onClick={() => setActiveModal('health_metrics')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl p-6 flex items-center justify-center gap-3 text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl mb-6"
              >
                <Heart className="w-6 h-6" />
                {t('logComprehensiveHealthData')}
              </button>

              {/* Quick Action Cards - Clean and accessible */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <button
                  onClick={() => setActiveModal('glucose')}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md border-2 border-blue-200 hover:border-blue-400 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-all">
                    <Droplets className="w-6 h-6 text-blue-600 group-hover:text-white transition-all" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">{t('logGlucose')}</span>
                </button>

                <button
                  onClick={() => setActiveModal('meal')}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md border-2 border-orange-200 hover:border-orange-400 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-500 transition-all">
                    <Utensils className="w-6 h-6 text-orange-600 group-hover:text-white transition-all" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600">{t('logMeal')}</span>
                </button>

                <button
                  onClick={() => setActiveModal('medication')}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md border-2 border-green-200 hover:border-green-400 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-500 transition-all">
                    <Pill className="w-6 h-6 text-green-600 group-hover:text-white transition-all" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600">{t('logMedicine')}</span>
                </button>

                <button
                  onClick={() => setActiveModal('activity')}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md border-2 border-purple-200 hover:border-purple-400 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-500 transition-all">
                    <ActivityIcon className="w-6 h-6 text-purple-600 group-hover:text-white transition-all" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-600">{t('logActivity')}</span>
                </button>
              </div>

              {/* How are you feeling? - Encouraging and personal */}
              <button
                onClick={() => setActiveModal('feeling')}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl p-5 flex items-center justify-center gap-3 text-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Smile className="w-6 h-6" />
                {t('howAreYouFeelingToday')}
              </button>
            </div>

            {readings.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <Droplets className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No entries yet</h3>
                <p className="text-gray-600 mb-4">
                  Tap "Log Glucose" to record your glucose, meals, and medicines
                </p>
                <button
                  onClick={() => setActiveModal('glucose')}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Reading
                </button>
              </div>
            )}
          </div>
        )}

        {activeView === 'log' && <DailyLogList onUpdate={loadReadings} />}

        {activeView === 'charts' && !profile?.assigned_doctor_id && <GlucoseChart />}
      </main>

      {activeModal === 'glucose' && (
        <AddGlucoseModal 
          onClose={() => setActiveModal(null)} 
          onAdd={handleAddEntry} 
          preselectedType={selectedMealType}
        />
      )}
      {activeModal === 'meal' && (
        <AddMealModal onClose={() => setActiveModal(null)} onAdd={handleAddEntry} />
      )}
      {activeModal === 'activity' && (
        <AddActivityModal onClose={() => setActiveModal(null)} onAdd={handleAddEntry} />
      )}
      {activeModal === 'medication' && (
        <AddMedicationModal onClose={() => setActiveModal(null)} onAdd={handleAddEntry} />
      )}
      {activeModal === 'feeling' && (
        <AddFeelingModal onClose={() => setActiveModal(null)} onAdd={handleAddEntry} />
      )}
      {activeModal === 'health_metrics' && (
        <AddHealthMetricsModal
          onClose={() => {
            setActiveModal(null);
            setVoiceExtractedData(null);
          }}
          onAdd={handleAddEntry}
          voiceData={voiceExtractedData}
        />
      )}
      {activeModal === 'voice_input' && (
        <VoiceInputModal
          onClose={() => setActiveModal(null)}
          onDataExtracted={handleVoiceDataExtracted}
        />
      )}
      {activeModal === 'settings' && (
        <PatientSettings onClose={() => setActiveModal(null)} />
      )}

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
        onSettingsClick={() => {
          setIsNotificationPanelOpen(false);
          setIsNotificationSettingsOpen(true);
        }}
      />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
      />
    </div>
  );
}
