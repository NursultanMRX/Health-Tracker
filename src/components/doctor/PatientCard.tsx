import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Profile, GlucoseReading } from '../../lib/types';

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

  if (viewMode === 'list') {
    return (
      <button
        onClick={onClick}
        className={`w-full bg-white rounded-lg shadow-sm px-6 py-4 border-l-4 border-${statusColor}-500 hover:shadow-md transition-all flex items-center justify-between group`}
        style={{ borderLeftColor: `var(--${statusColor}-500)` }}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">
              {patient.full_name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Patient Info */}
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 text-lg">{patient.full_name}</h3>
            <p className="text-sm text-gray-500">
              {age ? `${age} years` : 'Age unknown'} {patient.sex ? `• ${patient.sex}` : ''}
            </p>
          </div>
        </div>

        {/* Metrics - Compact for list view */}
        <div className="flex items-center gap-6">
          {patient.diabetesRisk && (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Diabetes Risk</p>
              <p className="text-xl font-bold text-purple-600">{patient.diabetesRisk}</p>
            </div>
          )}
          {patient.hasData && patient.latestGlucose && (
            <>
              {/* Current Glucose */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Current</p>
                <div className="flex items-center gap-1">
                  <p className={`text-2xl font-bold ${getGlucoseColor(patient.latestGlucose)}`}>
                    {patient.latestGlucose}
                  </p>
                  <TrendIcon className={`w-5 h-5 ${trendColor}`} />
                </div>
              </div>

              {/* TIR */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">TIR</p>
                <p className="text-2xl font-bold text-gray-900">{tirPercentage}%</p>
              </div>
            </>
          )}

          {/* Status Badge */}
          {patient.hasActiveAlerts ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              Critical
            </span>
          ) : !patient.hasData ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              No Data
            </span>
          ) : tirPercentage < 70 ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Stable
            </span>
          )}

          {/* Chevron */}
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    );
  }

  // Grid view - More detailed card design
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-6 border-l-4 hover:shadow-lg transition-all text-left group relative overflow-hidden`}
      style={{
        borderLeftColor: statusColor === 'red' ? '#ef4444' : statusColor === 'yellow' ? '#eab308' : statusColor === 'green' ? '#22c55e' : '#9ca3af'
      }}
    >
      {/* Header: Avatar and Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xl">
            {patient.full_name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Status Badge - Color-coded for quick identification */}
        {patient.hasActiveAlerts ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            Critical
          </span>
        ) : !patient.hasData ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            No Data
          </span>
        ) : tirPercentage < 70 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Review
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Stable
          </span>
        )}
      </div>

      {/* Patient Name and Demographics */}
      <h3 className="font-bold text-gray-900 text-lg mb-1">{patient.full_name}</h3>
      <p className="text-sm text-gray-500 mb-4">
        {age ? `${age} years` : 'Age unknown'} {patient.sex ? `• ${patient.sex}` : ''}
      </p>

      {/* Diabetes Risk */}
      {patient.diabetesRisk && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs font-medium text-purple-700 mb-1">Diabetes Risk</p>
          <p className="text-2xl font-bold text-purple-900">{patient.diabetesRisk}</p>
        </div>
      )}

      {/* Main Content: Glucose Level and Trend */}
      {patient.hasData && patient.latestGlucose ? (
        <>
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Current Glucose</p>
            <div className="flex items-center gap-2">
              <p className={`text-3xl font-bold ${getGlucoseColor(patient.latestGlucose)}`}>
                {patient.latestGlucose}
              </p>
              <span className="text-sm text-gray-500">mg/dL</span>
              <TrendIcon className={`w-6 h-6 ${trendColor} ml-1`} />
            </div>
          </div>

          {/* Time in Range Donut Chart - Visual representation of long-term stability */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
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
              <p className="text-xs font-semibold text-gray-700 mb-0.5">Time in Range</p>
              <p className="text-xs text-gray-500">Last 14 days</p>
              <p className="text-xs text-gray-400 mt-1">Target: 70-180 mg/dL</p>
            </div>
          </div>
        </>
      ) : (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500">No glucose data available</p>
          <p className="text-xs text-gray-400 mt-1">Patient hasn't logged any readings</p>
        </div>
      )}

      {/* Hover Effect - Subtle visual feedback */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
    </button>
  );
}
