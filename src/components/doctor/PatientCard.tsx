import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Profile, GlucoseReading } from '../../lib/types';
import { useTranslation } from 'react-i18next';

// PatientCard is a mini-dashboard for each patient
// Design: Shows critical info at a glance - current glucose, trend, and Time in Range
type PatientWithMetrics = Profile & {
  hasActiveAlerts?: boolean;
  hasData?: boolean;
  latestGlucose?: number;
  glucoseTrend?: 'up' | 'down' | 'stable';
  timeInRange?: number;
  glucoseReadings?: GlucoseReading[];
  diabetesRisk?: string;
};

interface PatientCardProps {
  patient: PatientWithMetrics;
  onClick: () => void;
  viewMode?: 'grid' | 'list';
}

export default function PatientCard({ patient, onClick, viewMode = 'grid' }: PatientCardProps) {
  const { t } = useTranslation();

  // Determine status color for left border and badge
  const getStatusColor = () => {
    if (patient.hasActiveAlerts) return 'red';
    if (!patient.hasData) return 'gray';
    if ((patient.timeInRange || 0) < 70) return 'yellow';
    return 'green';
  };

  const statusColor = getStatusColor();

  // Determine glucose level color
  const getGlucoseColor = (value?: number) => {
    if (!value) return 'text-gray-400';
    if (value < 70) return 'text-yellow-600';
    if (value > 180) return 'text-red-600';
    return 'text-green-600';
  };

  // Render trend indicator icon
  const TrendIcon = patient.glucoseTrend === 'up'
    ? TrendingUp
    : patient.glucoseTrend === 'down'
    ? TrendingDown
    : Minus;

  const trendColor = patient.glucoseTrend === 'up'
    ? 'text-red-500'
    : patient.glucoseTrend === 'down'
    ? 'text-blue-500'
    : 'text-gray-400';

  // Calculate TIR donut chart percentage (0-360 degrees)
  const tirPercentage = patient.timeInRange || 0;
  const tirDegrees = (tirPercentage / 100) * 360;

  // Get age
  const age = patient.age || (patient.date_of_birth
    ? Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / 31557600000)
    : null);

  // Get formatted demographics with conditional logic
  const getDemographicsText = () => {
    const parts = [];

    // Age
    if (age) {
      parts.push(t('commandCenter.patientCard.demographics.age', { age }));
    } else {
      parts.push(t('commandCenter.patientCard.demographics.ageUnknown'));
    }

    // Gender
    if (patient.sex) {
      const genderKey = patient.sex.toLowerCase();
      if (genderKey === 'male' || genderKey === 'female' || genderKey === 'other') {
        parts.push(t(`commandCenter.patientCard.demographics.${genderKey}`));
      } else {
        parts.push(patient.sex);
      }
    }

    return parts.join(' • ');
  };

  // Determine status bar color
  const getStatusBarColor = () => {
    if (patient.hasActiveAlerts) return '#ef4444'; // Red
    if (!patient.hasData) return '#9ca3af'; // Gray
    if ((patient.timeInRange || 0) < 70) return '#eab308'; // Yellow
    return '#22c55e'; // Green
  };

  // Get TIR color based on percentage
  const getTIRColor = (tir: number) => {
    if (tir >= 70) return 'text-green-600';
    if (tir >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (viewMode === 'list') {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className={`w-full bg-white px-3 sm:px-4 md:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-all group border-b border-gray-200`}
        >
          {/* Vertical Status Bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: getStatusBarColor() }}
          />

          {/* Mobile: Vertical layout, Tablet+: Horizontal layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pl-3">
            {/* Left Section: Avatar and Patient Info */}
            <div className="flex items-center gap-3 sm:gap-4">
            {/* Avatar */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base sm:text-lg">
                {patient.full_name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Patient Info */}
            <div className="text-left flex-1">
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{patient.full_name}</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {getDemographicsText()}
              </p>
            </div>

            {/* Status Badge - Mobile only */}
            <div className="sm:hidden">
              {patient.hasActiveAlerts ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                  {t('commandCenter.patientCard.status.critical')}
                </span>
              ) : !patient.hasData ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  {t('commandCenter.patientCard.status.noData')}
                </span>
              ) : tirPercentage < 70 ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                  {t('commandCenter.patientCard.status.review')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {t('commandCenter.patientCard.status.stable')}
                </span>
              )}
            </div>
          </div>

          {/* Right Section: Metrics - Labels below values */}
          <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
            {patient.diabetesRisk && (
              <div className="text-center">
                <p className="text-lg sm:text-xl md:text-2xl font-semibold text-purple-600 mb-0.5">{patient.diabetesRisk}</p>
                <p className="text-xs text-gray-500">{t('commandCenter.patientCard.labels.risk')}</p>
              </div>
            )}
            {patient.hasData && patient.latestGlucose && (
              <>
                {/* Current Glucose - Emphasized */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${getGlucoseColor(patient.latestGlucose)}`}>
                      {patient.latestGlucose}
                    </p>
                    <TrendIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${trendColor}`} />
                  </div>
                  <p className="text-xs text-gray-500">{t('commandCenter.patientCard.labels.current')}</p>
                </div>

                {/* TIR - Color coded */}
                <div className="text-center">
                  <p className={`text-lg sm:text-xl md:text-2xl font-semibold ${getTIRColor(tirPercentage)} mb-0.5`}>{tirPercentage}%</p>
                  <p className="text-xs text-gray-500">{t('commandCenter.patientCard.labels.tir')}</p>
                </div>
              </>
            )}

            {/* Status Badge - Tablet+ only */}
            <div className="hidden sm:block">
              {patient.hasActiveAlerts ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  {t('commandCenter.patientCard.status.critical')}
                </span>
              ) : !patient.hasData ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  {t('commandCenter.patientCard.status.noData')}
                </span>
              ) : tirPercentage < 70 ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  {t('commandCenter.patientCard.status.review')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {t('commandCenter.patientCard.status.stable')}
                </span>
              )}
            </div>

            {/* Chevron - Hidden on mobile */}
            <svg
              className="hidden sm:block w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          </div>
        </button>
      </div>
    );
  }

  // Grid view - More detailed card design
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6 border-l-4 hover:shadow-lg transition-all text-left group relative overflow-hidden`}
      style={{
        borderLeftColor: statusColor === 'red' ? '#ef4444' : statusColor === 'yellow' ? '#eab308' : statusColor === 'green' ? '#22c55e' : '#9ca3af'
      }}
    >
      {/* Header: Avatar and Status Badge */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg sm:text-xl">
            {patient.full_name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Status Badge - Color-coded for quick identification */}
        {patient.hasActiveAlerts ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            {t('commandCenter.patientCard.status.critical')}
          </span>
        ) : !patient.hasData ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            {t('commandCenter.patientCard.status.noData')}
          </span>
        ) : tirPercentage < 70 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            {t('commandCenter.patientCard.status.review')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {t('commandCenter.patientCard.status.stable')}
          </span>
        )}
      </div>

      {/* Patient Name and Demographics */}
      <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1">{patient.full_name}</h3>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
        {getDemographicsText()}
      </p>

      {/* Diabetes Risk */}
      {patient.diabetesRisk && (
        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs font-medium text-purple-700 mb-1">{t('commandCenter.patientCard.labels.diabetesRisk')}</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-900">{patient.diabetesRisk}</p>
        </div>
      )}

      {/* Main Content: Glucose Level and Trend */}
      {patient.hasData && patient.latestGlucose ? (
        <>
          <div className="mb-3 sm:mb-4">
            <p className="text-xs font-medium text-gray-500 mb-1">{t('commandCenter.patientCard.labels.currentGlucose')}</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <p className={`text-2xl sm:text-3xl font-bold ${getGlucoseColor(patient.latestGlucose)}`}>
                {patient.latestGlucose}
              </p>
              <span className="text-xs sm:text-sm text-gray-500">{t('mgdl')}</span>
              <TrendIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${trendColor} ml-0.5 sm:ml-1`} />
            </div>
          </div>

          {/* Time in Range Donut Chart - Visual representation of long-term stability */}
          <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
            {/* Simple CSS-based donut chart */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                {/* Progress circle - represents TIR percentage */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke={tirPercentage >= 70 ? '#22c55e' : tirPercentage >= 50 ? '#eab308' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${(tirPercentage / 100) * 97.4} 97.4`}
                  strokeLinecap="round"
                />
              </svg>
              {/* Center percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-700">{tirPercentage}%</span>
              </div>
            </div>

            {/* TIR Label and Explanation */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-700 mb-0.5">{t('commandCenter.patientCard.labels.timeInRange')}</p>
              <p className="text-xs text-gray-500">{t('commandCenter.patientCard.labels.last14Days')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('commandCenter.patientCard.labels.target', { low: 70, high: 180 })}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500">{t('commandCenter.patientCard.labels.noGlucoseData')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('commandCenter.patientCard.labels.patientHasntLogged')}</p>
        </div>
      )}

      {/* Hover Effect - Subtle visual feedback */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
    </button>
  );
}
