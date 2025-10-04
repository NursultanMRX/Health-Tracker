import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PatientOnboarding from './PatientOnboarding';
import PatientDashboard from './PatientDashboard';
import type { Profile } from '../../lib/types';

interface PatientPortalProps {
  profile: Profile;
}

/**
 * PatientPortal - Manages the patient experience flow
 *
 * This component encapsulates the logic for deciding whether to show:
 * 1. The onboarding wizard (if profile is incomplete)
 * 2. The main patient dashboard (if profile is complete)
 *
 * Design Decision: By isolating this logic in a dedicated component,
 * we keep App.tsx clean and make the patient flow easier to maintain.
 *
 * Backend-Driven Logic: Uses profile.is_profile_complete flag from the
 * backend instead of localStorage for more reliable state management.
 */
export default function PatientPortal({ profile }: PatientPortalProps) {
  const { updateProfileCompletion } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  // Handle onboarding completion
  // This function is called when the patient finishes the onboarding wizard
  const handleOnboardingComplete = async () => {
    try {
      setIsCompleting(true);

      // Call the backend to update profile completion status
      // This will set is_profile_complete: true in the database
      await updateProfileCompletion();

      // The profile will be automatically refreshed by updateProfileCompletion
      // which triggers a re-render with the updated profile data
      console.log('Onboarding completed successfully');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // TODO: Show error message to user
      alert('Failed to save onboarding data. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Conditional rendering based on profile completion status
  // Note: We use profile.is_profile_complete !== true (instead of === false)
  // to handle undefined/null cases as "incomplete" by default
  const isProfileIncomplete = profile.is_profile_complete !== true;

  if (isProfileIncomplete) {
    // Show onboarding wizard for new patients
    return <PatientOnboarding onComplete={handleOnboardingComplete} />;
  }

  // Show main dashboard for existing patients
  return <PatientDashboard />;
}
