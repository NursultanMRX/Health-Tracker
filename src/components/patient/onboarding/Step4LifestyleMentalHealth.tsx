import { Cigarette, Brain } from 'lucide-react';
import type { OnboardingFormData } from './OnboardingWizard';

interface Step4Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

// Step 4: Lifestyle & Mental Health
// Design: Non-judgmental, supportive tone for sensitive questions
// Asked last to build trust before requesting personal information
export default function Step4LifestyleMentalHealth({ formData, updateFormData }: Step4Props) {
  // Mental health options
  const mentalHealthOptions = [
    { value: 'depression', label: 'Depression' },
    { value: 'anxiety', label: 'Anxiety' },
    { value: 'other', label: 'Other' },
    { value: 'none', label: 'None' },
  ];

  // Toggle mental health selection
  const toggleMentalHealth = (value: string) => {
    let newMentalHealth = [...formData.mental_health];

    // If selecting "none", clear all others
    if (value === 'none') {
      newMentalHealth = ['none'];
    } else {
      // Remove "none" if selecting another option
      newMentalHealth = newMentalHealth.filter(item => item !== 'none');

      // Toggle the selected value
      if (newMentalHealth.includes(value)) {
        newMentalHealth = newMentalHealth.filter(item => item !== value);
      } else {
        newMentalHealth.push(value);
      }

      // If nothing selected, default to "none"
      if (newMentalHealth.length === 0) {
        newMentalHealth = ['none'];
      }
    }

    updateFormData({ mental_health: newMentalHealth });
  };

  return (
    <div className="space-y-6">
      {/* Section Header - Reassuring tone */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Lifestyle and Mental Health
        </h3>
        <p className="text-sm text-gray-600">
          Information about your lifestyle and mental health helps us provide better support.
        </p>
      </div>

      {/* Smoking History */}
      <div>
        <label htmlFor="smoking" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Cigarette className="w-4 h-4 text-[#3A86FF]" />
          Smoking Habit
          <span className="text-red-500">*</span>
        </label>

        {/* Custom Radio Button Group - More visual than default radio */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => updateFormData({ smoking_history: 'current' })}
            className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
              formData.smoking_history === 'current'
                ? 'border-[#3A86FF] bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">I currently smoke</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.smoking_history === 'current'
                    ? 'border-[#3A86FF] bg-[#3A86FF]'
                    : 'border-gray-300'
                }`}
              >
                {formData.smoking_history === 'current' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateFormData({ smoking_history: 'former' })}
            className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
              formData.smoking_history === 'former'
                ? 'border-[#3A86FF] bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">I formerly smoked</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.smoking_history === 'former'
                    ? 'border-[#3A86FF] bg-[#3A86FF]'
                    : 'border-gray-300'
                }`}
              >
                {formData.smoking_history === 'former' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateFormData({ smoking_history: 'never' })}
            className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
              formData.smoking_history === 'never'
                ? 'border-[#3A86FF] bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">I have never smoked</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.smoking_history === 'never'
                    ? 'border-[#3A86FF] bg-[#3A86FF]'
                    : 'border-gray-300'
                }`}
              >
                {formData.smoking_history === 'never' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mental Health Conditions - Multi-select checkboxes */}
      <div className="mt-8">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Brain className="w-4 h-4 text-[#3A86FF]" />
          Mental Health Diagnosis
        </label>
        <p className="text-xs text-gray-500 mb-3">Select all that apply</p>

        <div className="space-y-3">
          {mentalHealthOptions.map((option) => {
            const isSelected = formData.mental_health.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleMentalHealth(option.value)}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                  isSelected
                    ? 'border-[#3A86FF] bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">{option.label}</p>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-[#3A86FF] bg-[#3A86FF]'
                        : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Supportive Message */}
      <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">
              You are not alone
            </p>
            <p className="text-xs text-gray-700">
              Mental health is as important as physical health. Your honest answers help us
              provide you with the best care and support.
            </p>
          </div>
        </div>
      </div>

      {/* Final Reassurance */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">
              You're almost done!
            </p>
            <p className="text-xs text-gray-700">
              This is the final step. After clicking "Finish", your information will be
              securely saved and you can start tracking your health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
