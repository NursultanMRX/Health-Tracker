import { useEffect, useState } from 'react';
import { GlucoseReading } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { calculateTIR, calculateAverage, getDaysAgo, formatDate } from '../../lib/utils';
import { TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';

export default function PatientCharts() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadings();
  }, [days, user]);

  const loadReadings = async () => {
    if (!user) return;

    try {
      const startDate = getDaysAgo(days);
      const response = await fetch(`http://localhost:3001/api/glucose-readings?patient_id=${user.id}&start_date=${startDate.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load readings');

      const data = await response.json();
      setReadings(data || []);
    } catch (error) {
      console.error('Error loading readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgGlucose = calculateAverage(readings);
  const tir = calculateTIR(readings, settings?.target_low || 70, settings?.target_high || 180);
  const targetLow = settings?.target_low || 70;
  const targetHigh = settings?.target_high || 180;

  const belowTarget = readings.filter(r => r.value_mg_dl < targetLow).length;
  const inTarget = readings.filter(r => r.value_mg_dl >= targetLow && r.value_mg_dl <= targetHigh).length;
  const aboveTarget = readings.filter(r => r.value_mg_dl > targetHigh).length;

  const belowPercent = readings.length > 0 ? Math.round((belowTarget / readings.length) * 100) : 0;
  const inPercent = readings.length > 0 ? Math.round((inTarget / readings.length) * 100) : 0;
  const abovePercent = readings.length > 0 ? Math.round((aboveTarget / readings.length) * 100) : 0;

  // Prepare chart data - time series
  const chartData = readings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(r => ({
      date: new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: r.value_mg_dl,
      time: new Date(r.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600">Loading your glucose data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">My Glucose</h2>
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
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-600 mb-4">Today Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Average Reading</p>
            <p className="text-2xl font-bold text-gray-900">{avgGlucose || '--'}</p>
            <p className="text-xs text-gray-500">mg/dL over last {days} days</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Time in Range</p>
            <p className="text-2xl font-bold text-green-600">{tir}%</p>
            <p className="text-xs text-gray-500">Target: 70-180 mg/dL</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-600 mb-4">Glucose Trend ({days} days)</h3>
        <p className="text-sm text-gray-600 mb-6">
          Your average glucose is <span className="font-semibold">{avgGlucose} mg/dL</span> over the last {days} days
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
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
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
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

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-600 mb-4">Glucose Distribution</h3>
        <p className="text-sm text-gray-600 mb-6">
          Breakdown of readings by glucose range
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" />
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

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-600 mb-4">Time in Range</h3>
        <p className="text-sm text-gray-600 mb-6">
          {inPercent}% of your readings are in target range
        </p>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">In Range (70-180)</span>
              <span className="text-sm font-semibold text-green-700">{inPercent}%</span>
            </div>
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${inPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-700">Below Range (&lt;70)</span>
              <span className="text-sm font-semibold text-yellow-700">{belowPercent}%</span>
            </div>
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
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
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${abovePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {readings.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 mb-1">Tip</p>
              <p className="text-sm text-blue-800">
                {tir >= 70
                  ? 'Great job! Your glucose is well controlled. Keep up the good work!'
                  : tir >= 50
                  ? "You're doing well. Talk to your doctor about adjusting your routine to spend more time in target range."
                  : 'Your readings show room for improvement. Consider discussing your medication or meal timing with your doctor.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
