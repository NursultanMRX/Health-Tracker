import OnboardingWizard from './onboarding/OnboardingWizard';

type Props = {
  onComplete: () => void;
};

/**
 * PatientOnboarding - Wrapper component for the patient onboarding flow
 *
 * This component serves as a bridge between PatientPortal and OnboardingWizard
 * It receives the onComplete callback from PatientPortal and passes it to the wizard
 */
export default function PatientOnboarding({ onComplete }: Props) {
  return <OnboardingWizard onComplete={onComplete} />;
}
