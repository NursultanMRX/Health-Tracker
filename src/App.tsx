import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import AuthScreen from './components/auth/AuthScreen';
import PatientPortal from './components/patient/PatientPortal';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import LoadingScreen from './components/common/LoadingScreen';
import BookReadingPage from './components/patient/BookReadingPage';

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

  // Route to role-specific portal with React Router
  return (
    <Routes>
      {/* Patient Routes */}
      {profile.role === 'patient' && (
        <>
          <Route path="/" element={<PatientPortal profile={profile} />} />
          <Route path="/learning/:bookId" element={<BookReadingPage />} />
        </>
      )}

      {/* Doctor Routes */}
      {profile.role === 'doctor' && (
        <Route path="/" element={<DoctorDashboard />} />
      )}

      {/* Redirect any unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
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
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
