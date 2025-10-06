import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, Table } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

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

export default function PatientDetailView({ patient, onBack }: Props) {
  const { t } = useTranslation();
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [latestRisk, setLatestRisk] = useState<HealthMetric | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/patients/${patient.id}/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Set filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `report-${patient.full_name}-${new Date().toISOString().split('T')[0]}.${format}`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to normalize risk level from ML API
  const normalizeRiskLevel = (level: string): 'high' | 'medium' | 'low' => {
    const normalized = level.toLowerCase();
    if (normalized.includes('yuqori') || normalized === 'high') return 'high';
    if (normalized.includes("o'rta") || normalized === 'medium') return 'medium';
    return 'low';
  };

  // Get recommendation text based on risk level
  const getRecommendationText = (level: string): string => {
    const normalizedLevel = normalizeRiskLevel(level);
    if (normalizedLevel === 'high') return t('patientRecords.riskAssessment.recommendationTextHigh');
    if (normalizedLevel === 'medium') return t('patientRecords.riskAssessment.recommendationTextMedium');
    return t('patientRecords.riskAssessment.recommendationTextLow');
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
      [t('patientRecords.trendAnalysis.graphValue')]: r.value_mg_dl,
    }));

  // Prepare histogram data
  const histogramData = [
    { range: '<70', [t('patientRecords.trendAnalysis.graphCount')]: readings.filter(r => r.value_mg_dl < 70).length, color: '#EAB308' },
    { range: '70-99', [t('patientRecords.trendAnalysis.graphCount')]: readings.filter(r => r.value_mg_dl >= 70 && r.value_mg_dl < 100).length, color: '#22C55E' },
    { range: '100-129', [t('patientRecords.trendAnalysis.graphCount')]: readings.filter(r => r.value_mg_dl >= 100 && r.value_mg_dl < 130).length, color: '#22C55E' },
    { range: '130-159', [t('patientRecords.trendAnalysis.graphCount')]: readings.filter(r => r.value_mg_dl >= 130 && r.value_mg_dl < 160).length, color: '#F97316' },
    { range: '160-199', [t('patientRecords.trendAnalysis.graphCount')]: readings.filter(r => r.value_mg_dl >= 160 && r.value_mg_dl < 200).length, color: '#EF4444' },
    { range: '200+', [t('patientRecords.trendAnalysis.graphCount')]: readings.filter(r => r.value_mg_dl >= 200).length, color: '#DC2626' },
  ];

  // Get time range button text
  const getTimeRangeText = (d: number) => {
    if (d === 7) return t('patientRecords.monitoring.last7Days');
    if (d === 14) return t('patientRecords.monitoring.last14Days');
    return t('patientRecords.monitoring.last30Days');
  };

  // Get assessment text based on TIR
  const getAssessmentText = () => {
    if (tir >= 70) return t('patientRecords.assessment.excellentControl');
    if (tir >= 50) return t('patientRecords.assessment.moderateControl');
    return t('patientRecords.assessment.suboptimalControl');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('patientRecords.loading')}</p>
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
                <h1 className="text-xl font-bold text-gray-900">{t('patientRecords.header.title')}</h1>
                <p className="text-sm text-gray-600">
                  {t('patientRecords.header.viewing', {
                    patientName: patient.full_name,
                    patientEmail: patient.email
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Download Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isExporting
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span className="text-sm">{t('export.exporting')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span className="text-sm">{t('export.buttonLabel')}</span>
                    </>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showExportMenu && !isExporting && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      <span>{t('export.asPDF')}</span>
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Table className="w-4 h-4 text-green-500" />
                      <span>{t('export.asCSV')}</span>
                    </button>
                  </div>
                )}
              </div>

              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {t('patientRecords.header.doctorView')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button className="flex-1 py-3 px-4 font-medium text-blue-600 border-b-2 border-blue-600">
              {t('patientRecords.tabs.analytics')}
            </button>
            <button className="flex-1 py-3 px-4 font-medium text-gray-600 hover:text-gray-900">
              {t('patientRecords.tabs.history')}
            </button>
            <button className="flex-1 py-3 px-4 font-medium text-gray-600 hover:text-gray-900">
              {t('patientRecords.tabs.notes')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('patientRecords.monitoring.title')}</h2>
              <p className="text-sm text-gray-600">
                {t('patientRecords.monitoring.patientLabel', { patientName: patient.full_name })}
              </p>
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
                  {getTimeRangeText(d)}
                </button>
              ))}
            </div>
          </div>

          {/* Diabetes Risk Assessment */}
          {latestRisk && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 mb-4">
                {t('patientRecords.riskAssessment.title')}
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-purple-700 mb-1">
                    {t('patientRecords.riskAssessment.riskPercentage')}
                  </p>
                  <p className="text-4xl font-bold text-purple-900">{latestRisk.risk_percentage}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-700 mb-1">
                    {t('patientRecords.riskAssessment.riskLevel')}
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {t(`patientRecords.riskAssessment.riskLevelValue.${normalizeRiskLevel(latestRisk.risk_level)}`)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-purple-700 mb-1">
                    {t('patientRecords.riskAssessment.recommendation')}
                  </p>
                  <p className="text-sm text-purple-900 italic">
                    {getRecommendationText(latestRisk.risk_level)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-4">
              {t('patientRecords.clinicalSummary.title', { days })}
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {t('patientRecords.clinicalSummary.meanGlucose')}
                </p>
                <p className="text-4xl font-bold text-gray-900">{average}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('mgdl')} ({t('patientRecords.clinicalSummary.target', { range: '70-180 mg/dL' })})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {t('patientRecords.clinicalSummary.timeInRange')}
                </p>
                <p className="text-4xl font-bold text-green-600">{tir}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('patientRecords.clinicalSummary.adaTarget', { value: 70 })}
                </p>
              </div>
            </div>
          </div>

          {/* Glucose Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              {t('patientRecords.trendAnalysis.title', { days })}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('patientRecords.trendAnalysis.description', { value: average, days })}
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
                  label={{ value: t('mgdl'), angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey={t('patientRecords.trendAnalysis.graphValue')}
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
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              {t('patientRecords.distributionAnalysis.title')}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('patientRecords.distributionAnalysis.description')}
            </p>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{ value: t('patientRecords.distributionAnalysis.yAxisLabel'), angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <Bar dataKey={t('patientRecords.trendAnalysis.graphCount')} radius={[8, 8, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time in Range */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              {t('patientRecords.tirAnalysis.title')}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('patientRecords.tirAnalysis.description', {
                percentage: tir,
                range: '70-180 mg/dL'
              })}
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">
                    {t('patientRecords.tirAnalysis.inRange', { range: '70-180' })}
                  </span>
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
                  <span className="text-sm font-medium text-yellow-700">
                    {t('patientRecords.tirAnalysis.belowRange', { value: 70 })}
                  </span>
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
                  <span className="text-sm font-medium text-red-700">
                    {t('patientRecords.tirAnalysis.aboveRange', { value: 180 })}
                  </span>
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
                  <p className="font-medium text-blue-900 mb-1">
                    {t('patientRecords.assessment.title')}
                  </p>
                  <p className="text-sm text-blue-800">
                    {getAssessmentText()}
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
