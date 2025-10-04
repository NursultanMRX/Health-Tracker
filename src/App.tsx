import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import AuthScreen from './components/auth/AuthScreen';
import PatientPortal from './components/patient/PatientPortal';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import LoadingScreen from './components/common/LoadingScreen';

/**
 * AppContent - Main application routing logic
 *
 * Responsibilities:
 * 1. Show loading screen while authentication state is being determined
 * 2. Show auth screen for unauthenticated users
 * 3. Route authenticated users to their role-specific portal:
 *    - Patient → PatientPortal (handles onboarding vs dashboard)
 *    - Doctor → DoctorDashboard
 *
 * Design: Simplified to focus only on top-level routing.
 * Complex conditional logic moved to role-specific portal components.
 */
function AppContent() {
  const { user, profile, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Show auth screen for unauthenticated users
  if (!user || !profile) {
    return <AuthScreen />;
  }

  // Route to role-specific portal
  // PatientPortal handles onboarding vs dashboard logic internally
  if (profile.role === 'patient') {
    return <PatientPortal profile={profile} />;
  }

  // Doctors go directly to their dashboard
  if (profile.role === 'doctor') {
    return <DoctorDashboard />;
  }

  // Fallback for unknown roles (should never happen)
  return null;
}

/**
 * App - Root component
 *
 * Sets up global context providers:
 * - AuthProvider: Manages authentication state
 * - SettingsProvider: Manages user settings/preferences
 */
function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
