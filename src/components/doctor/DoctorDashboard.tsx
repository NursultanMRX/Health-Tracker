import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';


import type { Profile,  GlucoseReading } from '../../lib/types';
import { Search, LogOut,  Users, Activity, AlertCircle, LayoutGrid, List, Filter } from 'lucide-react';
import PatientDetailView from './PatientDetailView';
import PatientCard from './PatientCard';

type PatientWithAlerts = Profile & {
  hasActiveAlerts?: boolean;
  hasData?: boolean;
  latestGlucose?: number;
  glucoseTrend?: 'up' | 'down' | 'stable';
  timeInRange?: number;
  glucoseReadings?: GlucoseReading[];
  diabetesRisk?: string;
};

type SortOption = 'critical_first' | 'stable_first' | 'recent_first' | 'oldest_first';

export default function DoctorDashboard() {
  const { profile, signOut } = useAuth();
  const [patients, setPatients] = useState<PatientWithAlerts[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('critical_first');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      // Load all patients
      const response = await fetch('http://localhost:3001/api/profiles?role=patient', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load patients');

      const allPatientsData = await response.json();

      // Filter patients: only show those assigned to this doctor
      const patientsData = allPatientsData.filter((patient: any) =>
        patient.assigned_doctor_id === profile?.id
      );

      // Load clinical alerts
      const alertsResponse = await fetch('http://localhost:3001/api/clinical-alerts?status=active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const alerts = alertsResponse.ok ? await alertsResponse.json() : [];
      const patientsWithAlertIds = new Set(alerts.map((a: any) => a.patient_id));

      // Check if each patient has glucose readings data and calculate metrics
      const patientsWithStatus = await Promise.all(
        (patientsData || []).map(async (patient: any) => {
          try {
            const glucoseResponse = await fetch(
              `http://localhost:3001/api/glucose-readings?patient_id=${patient.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
              }
            );
            const glucoseData = glucoseResponse.ok ? await glucoseResponse.json() : [];

            // Fetch health metrics data to get diabetes risk
            const healthMetricsResponse = await fetch(
              `http://localhost:3001/api/health-metrics?patient_id=${patient.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
              }
            );
            const healthMetricsData = healthMetricsResponse.ok ? await healthMetricsResponse.json() : [];

            // Sort glucose readings by timestamp (newest first)
            const sortedReadings = (glucoseData || []).sort((a: GlucoseReading, b: GlucoseReading) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // Get latest health metric with risk data (sorted by timestamp)
            const sortedHealthMetrics = (healthMetricsData || []).sort((a: any, b: any) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            const latestHealthMetric = sortedHealthMetrics[0];

            // Calculate latest glucose and trend
            const latestReading = sortedReadings[0];
            const previousReading = sortedReadings[1];
            let glucoseTrend: 'up' | 'down' | 'stable' = 'stable';

            if (latestReading && previousReading) {
              const diff = latestReading.value_mg_dl - previousReading.value_mg_dl;
              if (diff > 10) glucoseTrend = 'up';
              else if (diff < -10) glucoseTrend = 'down';
            }

            // Calculate Time in Range (last 14 days)
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const recentReadings = sortedReadings.filter((r: GlucoseReading) =>
              new Date(r.timestamp) >= fourteenDaysAgo
            );

            const inRangeCount = recentReadings.filter((r: GlucoseReading) =>
              r.value_mg_dl >= 70 && r.value_mg_dl <= 180
            ).length;
            const timeInRange = recentReadings.length > 0
              ? Math.round((inRangeCount / recentReadings.length) * 100)
              : 0;

            return {
              ...patient,
              hasActiveAlerts: patientsWithAlertIds.has(patient.id),
              hasData: glucoseData && glucoseData.length > 0,
              latestGlucose: latestReading?.value_mg_dl,
              glucoseTrend,
              timeInRange,
              glucoseReadings: recentReadings.slice(0, 100), // Last 100 readings for chart
              diabetesRisk: latestHealthMetric?.risk_percentage,
            };
          } catch {
            return {
              ...patient,
              hasActiveAlerts: patientsWithAlertIds.has(patient.id),
              hasData: false,
            };
          }
        })
      );

      setPatients(patientsWithStatus);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort patients based on selected option
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch (sortBy) {
      case 'critical_first':
        // Critical (with alerts) first, then stable
        if (a.hasActiveAlerts && !b.hasActiveAlerts) return -1;
        if (!a.hasActiveAlerts && b.hasActiveAlerts) return 1;
        // If same status, sort by creation date (newest first)
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();

      case 'stable_first':
        // Stable first, then critical
        if (!a.hasActiveAlerts && b.hasActiveAlerts) return -1;
        if (a.hasActiveAlerts && !b.hasActiveAlerts) return 1;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();

      case 'recent_first':
        // Most recently registered first
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();

      case 'oldest_first':
        // First registered first
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();

      default:
        return 0;
    }
  });

  if (selectedPatient) {
    return (
      <PatientDetailView
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  // Calculate summary statistics for the header
  const criticalCount = patients.filter(p => p.hasActiveAlerts).length;
  const needsAttentionCount = patients.filter(p => !p.hasActiveAlerts && p.hasData && (p.timeInRange || 0) < 70).length;
  const stableCount = patients.filter(p => !p.hasActiveAlerts && p.hasData && (p.timeInRange || 0) >= 70).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Command Center Header with Summary Statistics */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Command Center</h1>
              <p className="text-sm text-gray-600">Welcome back, Dr. {profile?.full_name}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* High-level Summary Statistics - Data-rich overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-900 mb-1">Critical</p>
                  <p className="text-3xl font-bold text-red-700">{criticalCount}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-500 opacity-80" />
              </div>
              <p className="text-xs text-red-700 mt-2">Active alerts - Immediate attention required</p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">Needs Attention</p>
                  <p className="text-3xl font-bold text-yellow-700">{needsAttentionCount}</p>
                </div>
                <Activity className="w-10 h-10 text-yellow-500 opacity-80" />
              </div>
              <p className="text-xs text-yellow-700 mt-2">TIR below 70% - Review recommended</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">Stable</p>
                  <p className="text-3xl font-bold text-green-700">{stableCount}</p>
                </div>
                <Users className="w-10 h-10 text-green-500 opacity-80" />
              </div>
              <p className="text-xs text-green-700 mt-2">Well-controlled - Continue monitoring</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        {/* Clean and Intuitive Search, Filter, and Sort Controls */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            {/* Search Bar - Prominent and easy to use */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients by name, email, or ID..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Sort Dropdown - Clean design */}
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
              >
                <option value="critical_first">Critical First</option>
                <option value="stable_first">Stable First</option>
                <option value="recent_first">Recently Added</option>
                <option value="oldest_first">Oldest First</option>
              </select>
            </div>

            {/* View Mode Toggle - Grid/List */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        { loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients yet</h3>
            <p className="text-gray-600">
              Patients will appear here once they grant you access to their data
            </p>
          </div>
        ) : (
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onClick={() => setSelectedPatient(patient)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onClick={() => setSelectedPatient(patient)}
                    viewMode="list"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
