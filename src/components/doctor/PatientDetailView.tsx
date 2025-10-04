import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

type GlucoseReading = {
  id: string;
  value_mg_dl: number;
  timestamp: string;
  measurement_type: string;
};

type Patient = {
  id: string;
  full_name: string;
  email: string;
};

type HealthMetric = {
  risk_percentage: string;
  risk_level: string;
  recommendation: string;
  timestamp: string;
};

type Props = {
  patient: Patient;
  onBack: () => void;
};

const API_URL = 'http://localhost:3001/api';

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

export default function PatientDetailView({ patient, onBack }: Props) {
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [latestRisk, setLatestRisk] = useState<HealthMetric | null>(null);

  useEffect(() => {
    loadReadings();
    loadLatestRisk();
  }, [days, patient.id]);

  const loadReadings = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_URL}/glucose-readings?patient_id=${patient.id}&start_date=${startDate.toISOString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to load readings');

      const data = await response.json();
      setReadings(data || []);
    } catch (error) {
      console.error('Error loading readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestRisk = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_URL}/health-metrics?patient_id=${patient.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

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

  // Calculate statistics
  const targetLow = 70;
  const targetHigh = 180;
  const values = readings.map(r => r.value_mg_dl);
  const average = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const inRange = readings.filter(r => r.value_mg_dl >= targetLow && r.value_mg_dl <= targetHigh).length;
  const tir = readings.length > 0 ? Math.round((inRange / readings.length) * 100) : 0;

  const belowTarget = readings.filter(r => r.value_mg_dl < targetLow).length;
  const aboveTarget = readings.filter(r => r.value_mg_dl > targetHigh).length;
  const belowPercent = readings.length > 0 ? Math.round((belowTarget / readings.length) * 100) : 0;
  const abovePercent = readings.length > 0 ? Math.round((aboveTarget / readings.length) * 100) : 0;

  // Prepare chart data
  const chartData = readings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(r => ({
      date: new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: r.value_mg_dl,
    }));

  // Prepare histogram data
  const histogramData = [
    { range: '<70', count: readings.filter(r => r.value_mg_dl < 70).length, color: '#EAB308' },
    { range: '70-99', count: readings.filter(r => r.value_mg_dl >= 70 && r.value_mg_dl < 100).length, color: '#22C55E' },
    { range: '100-129', count: readings.filter(r => r.value_mg_dl >= 100 && r.value_mg_dl < 130).length, color: '#22C55E' },
    { range: '130-159', count: readings.filter(r => r.value_mg_dl >= 130 && r.value_mg_dl < 160).length, color: '#F97316' },
    { range: '160-199', count: readings.filter(r => r.value_mg_dl >= 160 && r.value_mg_dl < 200).length, color: '#EF4444' },
    { range: '200+', count: readings.filter(r => r.value_mg_dl >= 200).length, color: '#DC2626' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Patient Medical Records</h1>
                <p className="text-sm text-gray-600">Viewing: {patient.full_name} ({patient.email})</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Doctor View
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button className="flex-1 py-3 px-4 font-medium text-blue-600 border-b-2 border-blue-600">
              Glucose Analytics
            </button>
            <button className="flex-1 py-3 px-4 font-medium text-gray-600 hover:text-gray-900">
              Medical History
            </button>
            <button className="flex-1 py-3 px-4 font-medium text-gray-600 hover:text-gray-900">
              Clinical Notes
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Glucose Monitoring Data</h2>
              <p className="text-sm text-gray-600">Patient: {patient.full_name}</p>
            </div>
            <div className="flex gap-2">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    days === d
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last {d} days
                </button>
              ))}
            </div>
          </div>

          {/* Diabetes Risk Assessment */}
          {latestRisk && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 mb-4">Diabetes Risk Assessment</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-purple-700 mb-1">Risk Percentage</p>
                  <p className="text-4xl font-bold text-purple-900">{latestRisk.risk_percentage}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-700 mb-1">Risk Level</p>
                  <p className="text-2xl font-bold text-purple-900">{translateRiskLevel(latestRisk.risk_level)}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-700 mb-1">Recommendation</p>
                  <p className="text-sm text-purple-900 italic">{translateRecommendation(latestRisk.recommendation)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Clinical Summary - Last {days} Days</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-1">Mean Glucose</p>
                <p className="text-4xl font-bold text-gray-900">{average}</p>
                <p className="text-xs text-gray-500 mt-1">mg/dL (Target: 70-180 mg/dL)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Time in Range (TIR)</p>
                <p className="text-4xl font-bold text-green-600">{tir}%</p>
                  <p className="text-xs text-gray-500 mt-1">ADA Target: &gt;70%</p>
              </div>
            </div>
          </div>

          {/* Glucose Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Glucose Trend Analysis ({days} days)</h3>
            <p className="text-sm text-gray-600 mb-6">
              Patient's mean glucose: {average} mg/dL over the last {days} days
            </p>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 250]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey={() => targetHigh}
                  stroke="#EF4444"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={() => targetLow}
                  stroke="#EAB308"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Glucose Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Glucose Distribution Analysis</h3>
            <p className="text-sm text-gray-600 mb-6">
              Clinical breakdown of readings by glucose range categories
            </p>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time in Range */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Time in Range (TIR) Analysis</h3>
            <p className="text-sm text-gray-600 mb-6">
              {tir}% of patient's readings are within target range (70-180 mg/dL)
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">In Range (70-180)</span>
                  <span className="text-sm font-semibold text-green-700">{tir}%</span>
                </div>
                <div className="h-10 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${tir}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-700">Below Range (&lt;70)</span>
                  <span className="text-sm font-semibold text-yellow-700">{belowPercent}%</span>
                </div>
                <div className="h-10 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${belowPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-700">Above Range (&gt;180)</span>
                  <span className="text-sm font-semibold text-red-700">{abovePercent}%</span>
                </div>
                <div className="h-10 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${abovePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Assessment */}
          {readings.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-lg">📊</span>
                <div>
                  <p className="font-medium text-blue-900 mb-1">Clinical Assessment</p>
                  <p className="text-sm text-blue-800">
                    {tir >= 70
                      ? 'Excellent glucose control. Patient is meeting ADA targets for time in range.'
                      : tir >= 50
                      ? 'Moderate glucose control. Consider medication adjustment or lifestyle modifications to improve time in range.'
                      : 'Suboptimal glucose control. Recommend immediate intervention - consider medication review, dietary counseling, or insulin adjustment.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
