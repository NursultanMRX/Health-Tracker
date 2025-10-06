import { useState } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import Step1BasicInfo from './Step1BasicInfo';
import Step2PhysicalMeasurements from './Step2PhysicalMeasurements';
import Step3MedicalHistory from './Step3MedicalHistory';
import Step4LifestyleMentalHealth from './Step4LifestyleMentalHealth';

// Form data type definition
export type OnboardingFormData = {
  // Step 1: Basic Information
  dateOfBirth: string;
  gender: 'female' | 'male' | '';

  // Step 2: Physical Measurements
  height_cm: string;
  weight_kg: string;

  // Step 3: Medical History
  hypertension: boolean;
  heart_disease: boolean;

  // Step 4: Lifestyle & Mental Health
  smoking_history: 'current' | 'former' | 'never' | '';
  mental_health: string[]; // Array of selected conditions
};

type Props = {
  onComplete: () => void;
};

// Multi-step wizard component
// Design: Professional, trustworthy feel with clear progress indication
export default function OnboardingWizard({ onComplete }: Props) {
  const { user, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 4;

  // Centralized form state - manages all data across steps
  const [formData, setFormData] = useState<OnboardingFormData>({
    dateOfBirth: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    hypertension: false,
    heart_disease: false,
    smoking_history: '',
    mental_health: [],
  });

  // Update form data from any step
  const updateFormData = (newData: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  // Validation for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.dateOfBirth && formData.gender);
      case 2:
        return !!(formData.height_cm && formData.weight_kg &&
                  parseFloat(formData.height_cm) > 0 && parseFloat(formData.weight_kg) > 0);
      case 3:
        // Medical history is optional, always valid
        return true;
      case 4:
        return !!formData.smoking_history;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    // If on the first step, log out and redirect to auth screen
    if (currentStep === 1) {
      signOut();
      // Note: signOut() in AuthContext should handle the redirect to auth screen
    } else {
      // For all other steps, go back to the previous step
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      console.error('No user logged in');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Save onboarding data to the database
      const response = await fetch('http://localhost:3001/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: user.id,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          country: '',
          height_cm: formData.height_cm,
          weight_kg: formData.weight_kg,
          hypertension: formData.hypertension,
          heart_disease: formData.heart_disease,
          smoking_history: formData.smoking_history,
          mental_health: formData.mental_health,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save onboarding data');
      }

      console.log('Onboarding data saved successfully');

      // Call the onComplete callback to mark profile as complete and redirect to dashboard
      onComplete();
    } catch (error) {
      console.error('Failed to submit onboarding:', error);
      alert('Failed to save your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = validateStep(currentStep);

  // Steps configuration for progress indicator
  const steps = [
    { number: 1, title: 'Basic Info', titleEn: 'Basic Info' },
    { number: 2, title: 'Physical Data', titleEn: 'Physical Data' },
    { number: 3, title: 'Medical History', titleEn: 'Medical History' },
    { number: 4, title: 'Lifestyle', titleEn: 'Lifestyle' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 font-[Poppins]">
      <div className="max-w-3xl mx-auto">
        {/* Header - Builds trust and explains purpose */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3A86FF] rounded-full mb-4 shadow-lg">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Health Assessment Profile
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Answer a few simple questions to help us understand and support your health better. All information is kept secure and confidential.
          </p>
        </div>

        {/* Progress Bar - Clear visual indication of current position */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      step.number < currentStep
                        ? 'bg-green-500 text-white shadow-md'
                        : step.number === currentStep
                        ? 'bg-[#3A86FF] text-white shadow-lg ring-4 ring-blue-200'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  {/* Step Label - Hidden on mobile for space */}
                  <div className="absolute top-12 text-center w-24 hidden sm:block">
                    <p className={`text-xs font-medium ${
                      step.number === currentStep ? 'text-[#3A86FF]' : 'text-gray-500'
                    }`}>
                      {step.titleEn}
                    </p>
                  </div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all ${
                      step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Mobile Step Title */}
          <div className="text-center mt-6 sm:hidden">
            <p className="text-sm font-semibold text-[#3A86FF]">
              {steps[currentStep - 1].titleEn}
            </p>
          </div>
        </div>

        {/* Step Content Card - Clean, centered layout with whitespace */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 mb-8 border border-gray-100">
          {/* Step Title for Desktop */}
          <div className="mb-8 hidden sm:block">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm text-gray-500">
              Step {currentStep} / {totalSteps}
            </p>
          </div>

          {/* Render current step component */}
          <div className="min-h-[300px]">
            {currentStep === 1 && (
              <Step1BasicInfo formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 2 && (
              <Step2PhysicalMeasurements formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 3 && (
              <Step3MedicalHistory formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 4 && (
              <Step4LifestyleMentalHealth formData={formData} updateFormData={updateFormData} />
            )}
          </div>

          {/* Navigation Buttons - Clear and accessible */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            <div className="flex-1 text-center mx-4">
              {!isStepValid && (
                <p className="text-xs text-red-600 font-medium">
                  Please fill in all required fields
                </p>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!isStepValid || isSubmitting}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                isStepValid && !isSubmitting
                  ? 'bg-[#3A86FF] text-white hover:bg-[#2E6FCC] shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentStep === totalSteps ? (
                <>
                  {isSubmitting ? 'Saving...' : 'Finish'}
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Trust & Security Message */}
        <div className="text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Your data is protected with 256-bit encryption
          </p>
        </div>
      </div>
    </div>
  );
}
