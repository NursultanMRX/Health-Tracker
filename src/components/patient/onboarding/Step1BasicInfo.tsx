import { Calendar, User } from 'lucide-react';
import type { OnboardingFormData } from './OnboardingWizard';

interface Step1Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

// Step 1: Basic Information
// Design: Simple, non-intimidating questions to start the process
export default function Step1BasicInfo({ formData, updateFormData }: Step1Props) {
  return (
    <div className="space-y-6">
      {/* Date of Birth */}
      <div>
        <label htmlFor="dateOfBirth" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Calendar className="w-4 h-4 text-[#3A86FF]" />
          Date of Birth
          <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
          max={new Date().toISOString().split('T')[0]} // Cannot select future dates
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all text-base font-medium"
          required
        />
      </div>

      {/* Gender */}
      <div>
        <label htmlFor="gender" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <User className="w-4 h-4 text-[#3A86FF]" />
          Gender
          <span className="text-red-500">*</span>
        </label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => updateFormData({ gender: e.target.value as 'female' | 'male' | '' })}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all text-base font-medium bg-white cursor-pointer"
          required
        >
          <option value="">Select</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>
      </div>

      {/* Info Box - Explains why this data is needed */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-[#3A86FF]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">
              Why do we need this information?
            </p>
            <p className="text-xs text-gray-600">
              Age and gender are important factors in assessing your health.
              This information helps us provide personalized recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
