import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { buildApiUrl } from '../../lib/config';

type HealthMetric = {
  id: string;
  patient_id: string;
  timestamp: string;
  exercise_level: string;
  diet_type: string;
  sleep_hours: number;
  stress_level: string;
  work_hours_per_week: number;
  screen_time_per_day_hours: number;
  social_interaction_score: number;
  happiness_score: number;
  hba1c_level: number;
  blood_glucose_level: number;
  created_at: string;
};

const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  quaternary: '#8B5CF6',
  quinary: '#EC4899',
};

export default function HealthMetricsCharts() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [user]);

  const loadMetrics = async () => {
    try {
      const response = await fetch(buildApiUrl(`/health-metrics?patient_id=${user?.id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load health metrics');

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Health Data Yet</h3>
        <p className="text-gray-600">
          Start logging your comprehensive health data to see insightful charts and trends!
        </p>
      </div>
    );
  }

  // Prepare data for charts
  const timeSeriesData = metrics.map(m => ({
    date: new Date(m.timestamp).toLocaleDateString(),
    glucose: m.blood_glucose_level,
    hba1c: m.hba1c_level,
    sleep: m.sleep_hours,
    happiness: m.happiness_score,
    social: m.social_interaction_score,
  })).reverse();

  // Diet type distribution
  const dietCounts: Record<string, number> = {};
  metrics.forEach(m => {
    dietCounts[m.diet_type] = (dietCounts[m.diet_type] || 0) + 1;
  });
  const dietData = Object.entries(dietCounts).map(([name, value]) => ({ name, value }));

  // Exercise level distribution
  const exerciseCounts: Record<string, number> = {};
  metrics.forEach(m => {
    exerciseCounts[m.exercise_level] = (exerciseCounts[m.exercise_level] || 0) + 1;
  });
  const exerciseData = Object.entries(exerciseCounts).map(([name, value]) => ({ name, value }));

  // Latest metric for radar chart
  const latestMetric = metrics[0];
  const radarData = [
    { metric: 'Sleep', value: (latestMetric.sleep_hours / 10) * 100 },
    { metric: 'Happiness', value: (latestMetric.happiness_score / 10) * 100 },
    { metric: 'Social', value: (latestMetric.social_interaction_score / 10) * 100 },
    { metric: 'Exercise', value: latestMetric.exercise_level === 'High' ? 100 : latestMetric.exercise_level === 'Moderate' ? 60 : 30 },
    { metric: 'Stress (inv)', value: latestMetric.stress_level === 'Low' ? 100 : latestMetric.stress_level === 'Moderate' ? 60 : 30 },
    { metric: 'BMI Health', value: latestMetric.bmi >= 18.5 && latestMetric.bmi <= 25 ? 100 : latestMetric.bmi < 18.5 ? 60 : 40 },
  ];

  // BMI trend data
  const bmiData = metrics.map(m => ({
    date: new Date(m.timestamp).toLocaleDateString(),
    bmi: m.bmi,
    age: m.age,
  })).reverse();

  // Health conditions data
  const hypertensionCount = metrics.filter(m => m.hypertension === 1).length;
  const heartDiseaseCount = metrics.filter(m => m.heart_disease === 1).length;
  const healthConditionsData = [
    { condition: 'Hypertension', count: hypertensionCount },
    { condition: 'Heart Disease', count: heartDiseaseCount },
    { condition: 'Healthy', count: metrics.length - hypertensionCount - heartDiseaseCount },
  ].filter(d => d.count > 0);

  // Gender distribution
  const genderCounts: Record<string, number> = {};
  metrics.forEach(m => {
    genderCounts[m.gender] = (genderCounts[m.gender] || 0) + 1;
  });
  const genderData = Object.entries(genderCounts).map(([name, value]) => ({ name, value }));

  // Mental health distribution
  const mentalHealthCounts: Record<string, number> = {};
  metrics.forEach(m => {
    mentalHealthCounts[m.mental_health_condition] = (mentalHealthCounts[m.mental_health_condition] || 0) + 1;
  });
  const mentalHealthData = Object.entries(mentalHealthCounts).map(([name, value]) => ({ name, value }));

  // Work and screen time comparison
  const workScreenData = metrics.map(m => ({
    date: new Date(m.timestamp).toLocaleDateString(),
    work: m.work_hours_per_week,
    screen: m.screen_time_per_day_hours * 7, // Convert to weekly
  })).reverse();

  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Health Metrics Analytics</h2>

      {/* Glucose & HbA1c Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Blood Glucose & HbA1c Levels</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="glucose" stroke={COLORS.primary} name="Glucose (mg/dL)" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="hba1c" stroke={COLORS.tertiary} name="HbA1c (%)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Well-being Radar Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Well-being Score</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="Well-being" dataKey="value" stroke={COLORS.quaternary} fill={COLORS.quaternary} fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep, Happiness & Social Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mental & Social Health Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sleep" stroke={COLORS.secondary} name="Sleep Hours" strokeWidth={2} />
            <Line type="monotone" dataKey="happiness" stroke={COLORS.quinary} name="Happiness Score" strokeWidth={2} />
            <Line type="monotone" dataKey="social" stroke={COLORS.quaternary} name="Social Score" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Work vs Screen Time */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Work & Screen Time (Weekly Hours)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={workScreenData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="work" fill={COLORS.primary} name="Work Hours/Week" />
            <Bar dataKey="screen" fill={COLORS.tertiary} name="Screen Time/Week" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* BMI Trend */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">BMI Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={bmiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[15, 40]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="bmi" stroke={COLORS.primary} name="BMI" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Healthy (18.5-25)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Underweight (&lt;18.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Overweight (25-30)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Obese (&gt;30)</span>
          </div>
        </div>
      </div>

      {/* Diet & Exercise Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diet Type Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Diet Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dietData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dietData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Exercise Level Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercise Level Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={exerciseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {exerciseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Health Conditions, Gender & Mental Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Conditions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Conditions</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={healthConditionsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="condition" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.tertiary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Mental Health */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mental Health</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={mentalHealthData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {mentalHealthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-xs font-medium text-blue-900 mb-1">Avg Glucose</p>
          <p className="text-2xl font-bold text-blue-700">
            {Math.round(metrics.reduce((sum, m) => sum + m.blood_glucose_level, 0) / metrics.length)}
          </p>
          <p className="text-xs text-blue-600">mg/dL</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-xs font-medium text-green-900 mb-1">Avg Sleep</p>
          <p className="text-2xl font-bold text-green-700">
            {(metrics.reduce((sum, m) => sum + m.sleep_hours, 0) / metrics.length).toFixed(1)}
          </p>
          <p className="text-xs text-green-600">hours</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <p className="text-xs font-medium text-purple-900 mb-1">Avg Happiness</p>
          <p className="text-2xl font-bold text-purple-700">
            {(metrics.reduce((sum, m) => sum + m.happiness_score, 0) / metrics.length).toFixed(1)}
          </p>
          <p className="text-xs text-purple-600">/ 10</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
          <p className="text-xs font-medium text-pink-900 mb-1">Avg HbA1c</p>
          <p className="text-2xl font-bold text-pink-700">
            {(metrics.reduce((sum, m) => sum + m.hba1c_level, 0) / metrics.length).toFixed(1)}
          </p>
          <p className="text-xs text-pink-600">%</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <p className="text-xs font-medium text-orange-900 mb-1">Avg BMI</p>
          <p className="text-2xl font-bold text-orange-700">
            {(metrics.reduce((sum, m) => sum + m.bmi, 0) / metrics.length).toFixed(1)}
          </p>
          <p className="text-xs text-orange-600">kg/m²</p>
        </div>
      </div>
    </div>
  );
}
