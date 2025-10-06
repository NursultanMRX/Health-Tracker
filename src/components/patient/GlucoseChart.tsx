import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import type { GlucoseReading } from '../../lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { buildApiUrl } from '../../lib/config';

// GlucoseChart - A large, clean chart showing glucose trends
// Design: Main visual with 24h/7d/30d view options for different time ranges
export default function GlucoseChart() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadings();
  }, [timeRange, user]);

  const loadReadings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Calculate start date based on time range
      const now = new Date();
      const startDate = new Date();
      if (timeRange === '24h') {
        startDate.setHours(now.getHours() - 24);
      } else if (timeRange === '7d') {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setDate(now.getDate() - 30);
      }

      const response = await fetch(
        buildApiUrl(`/glucose-readings?patient_id=${user.id}&start_date=${startDate.toISOString()}`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
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

  // Target ranges from settings
  const targetLow = settings?.target_low || 70;
  const targetHigh = settings?.target_high || 180;

  // Calculate metrics
  const avgGlucose = readings.length > 0
    ? Math.round(readings.reduce((sum, r) => sum + r.value_mg_dl, 0) / readings.length)
    : 0;

  const inRangeCount = readings.filter(r => r.value_mg_dl >= targetLow && r.value_mg_dl <= targetHigh).length;
  const timeInRange = readings.length > 0 ? Math.round((inRangeCount / readings.length) * 100) : 0;

  // Prepare chart data - sorted by timestamp
  const chartData = readings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(r => {
      const date = new Date(r.timestamp);
      let timeLabel = '';

      if (timeRange === '24h') {
        // Show hour:minute for 24h view
        timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } else if (timeRange === '7d') {
        // Show day of week for 7d view
        timeLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      } else {
        // Show month/day for 30d view
        timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      return {
        time: timeLabel,
        value: r.value_mg_dl,
        timestamp: date.getTime(),
      };
    });

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const value = data.value;
      const date = new Date(data.payload.timestamp);

      // Determine color based on glucose level
      let statusColor = 'text-green-600';
      let statusText = 'Normal';
      if (value < targetLow) {
        statusColor = 'text-yellow-600';
        statusText = 'Low';
      } else if (value > targetHigh) {
        statusColor = 'text-red-600';
        statusText = 'High';
      }

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">
            {date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
          <p className={`text-2xl font-bold ${statusColor} mb-1`}>
            {value} <span className="text-sm font-normal">mg/dL</span>
          </p>
          <p className={`text-xs font-medium ${statusColor}`}>{statusText}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Loading your glucose data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Glucose Trends</h2>
          <p className="text-sm text-gray-600">
            Track your glucose levels over time
          </p>
        </div>

        {/* Time Range Buttons - Clean toggle design */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-5 py-2.5 rounded-md font-semibold text-sm transition-all ${
              timeRange === '24h'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            24 Hours
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-5 py-2.5 rounded-md font-semibold text-sm transition-all ${
              timeRange === '7d'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-5 py-2.5 rounded-md font-semibold text-sm transition-all ${
              timeRange === '30d'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Summary Stats - Quick overview of the data */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">Average</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{avgGlucose} <span className="text-lg font-normal">mg/dL</span></p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <p className="text-sm font-semibold text-green-900">Time in Range</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{timeInRange}%</p>
        </div>
      </div>

      {/* Main Chart - Large, clean line chart */}
      {readings.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              {/* Grid for readability */}
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              {/* X-axis: Time labels */}
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickMargin={10}
                interval={timeRange === '24h' ? 'preserveStartEnd' : 'preserveStartEnd'}
              />

              {/* Y-axis: Glucose values */}
              <YAxis
                domain={[0, 300]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickMargin={10}
                label={{
                  value: 'mg/dL',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
              />

              {/* Custom tooltip for detailed info on hover */}
              <Tooltip content={<CustomTooltip />} />

              {/* Target range reference lines */}
              <ReferenceLine
                y={targetHigh}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `High: ${targetHigh}`,
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 11,
                  fontWeight: 600
                }}
              />
              <ReferenceLine
                y={targetLow}
                stroke="#eab308"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Low: ${targetLow}`,
                  position: 'right',
                  fill: '#eab308',
                  fontSize: 11,
                  fontWeight: 600
                }}
              />

              {/* Main glucose line - smooth curve with gradient */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{
                  fill: '#3b82f6',
                  r: 4,
                  strokeWidth: 2,
                  stroke: '#fff'
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: '#fff'
                }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Chart Legend - Explains what the lines mean */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">Your Glucose</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-red-500"></div>
              <span className="text-xs font-medium text-gray-600">High Threshold ({targetHigh})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-yellow-500"></div>
              <span className="text-xs font-medium text-gray-600">Low Threshold ({targetLow})</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600">
            Start logging your glucose readings to see your trends here
          </p>
        </div>
      )}

      {/* Motivational Tip based on data */}
      {readings.length > 0 && (
        <div className={`rounded-xl p-5 border-2 ${
          timeInRange >= 70
            ? 'bg-green-50 border-green-200'
            : timeInRange >= 50
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <TrendingUp className={`w-6 h-6 mt-0.5 flex-shrink-0 ${
              timeInRange >= 70 ? 'text-green-600' : timeInRange >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`} />
            <div>
              <p className={`font-semibold mb-1 ${
                timeInRange >= 70 ? 'text-green-900' : timeInRange >= 50 ? 'text-yellow-900' : 'text-red-900'
              }`}>
                {timeInRange >= 70 && '🎉 Excellent Progress!'}
                {timeInRange >= 50 && timeInRange < 70 && '💪 Keep Going!'}
                {timeInRange < 50 && '📈 Room for Improvement'}
              </p>
              <p className={`text-sm ${
                timeInRange >= 70 ? 'text-green-800' : timeInRange >= 50 ? 'text-yellow-800' : 'text-red-800'
              }`}>
                {timeInRange >= 70
                  ? 'Your glucose levels are well controlled! Maintain your current routine and keep up the great work.'
                  : timeInRange >= 50
                  ? "You're making progress. Consider discussing your meal timing and medication schedule with your doctor."
                  : 'Your readings show significant variation. Please consult with your healthcare provider to adjust your treatment plan.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
