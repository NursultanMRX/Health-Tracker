import { Heart, Activity } from 'lucide-react';
import type { OnboardingFormData } from './OnboardingWizard';

interface Step3Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

// Toggle Switch Component - Modern UI control for yes/no questions
// Design: Smooth animation, clear visual feedback, accessible
function ToggleSwitch({
  enabled,
  onChange,
  label,
  sublabel
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
  sublabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-xl transition-all group"
    >
      <div className="flex-1 text-left">
        <p className="text-base font-semibold text-gray-800 mb-1">
          {label}
        </p>
        <p className="text-xs text-gray-500">
          {sublabel}
        </p>
      </div>

      {/* Toggle Switch UI */}
      <div className="flex-shrink-0 ml-4">
        <div
          className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
            enabled ? 'bg-[#3A86FF]' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
              enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </div>
        <p className={`text-xs font-semibold mt-1 text-center transition-colors ${
          enabled ? 'text-[#3A86FF]' : 'text-gray-500'
        }`}>
          {enabled ? 'Ha / Yes' : 'Yo\'q / No'}
        </p>
      </div>
    </button>
  );
}

// Step 3: Medical History
// Design: Yes/No toggle switches for diagnosed conditions
// Non-judgmental, clinical approach
export default function Step3MedicalHistory({ formData, updateFormData }: Step3Props) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Tibbiy tarix
        </h3>
        <p className="text-sm text-gray-600">
          Sizda quyidagi kasalliklardan birontasi tashxislangan bo'lsa, belgilang.
        </p>
        <p className="text-xs text-gray-500 italic mt-1">
          Indicate if you have been diagnosed with any of the following conditions.
        </p>
      </div>

      {/* Hypertension Toggle */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-[#3A86FF]" />
          <p className="text-sm font-semibold text-gray-700">
            Yuqori qon bosimi (Gipertoniya)
          </p>
        </div>
        <ToggleSwitch
          enabled={formData.hypertension}
          onChange={(value) => updateFormData({ hypertension: value })}
          label="Gipertoniya tashxisingiz bormi?"
          sublabel="Do you have a hypertension diagnosis?"
        />
      </div>

      {/* Heart Disease Toggle */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-[#3A86FF]" />
          <p className="text-sm font-semibold text-gray-700">
            Yurak kasalliklari
          </p>
        </div>
        <ToggleSwitch
          enabled={formData.heart_disease}
          onChange={(value) => updateFormData({ heart_disease: value })}
          label="Yurak kasalliklari tashxisingiz bormi?"
          sublabel="Do you have a heart disease diagnosis?"
        />
      </div>

      {/* Info Box - Reassurance about medical data */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-[#3A86FF]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">
              Tibbiy ma'lumotlar maxfiyligi
            </p>
            <p className="text-xs text-gray-600">
              Sizning tibbiy ma'lumotlaringiz to'liq maxfiy saqlanadi va faqat
              sog'ligingizni baholash uchun ishlatiladi. Hech qanday uchinchi tomon
              bu ma'lumotlarga kirish huquqiga ega emas.
            </p>
            <p className="text-xs text-gray-500 mt-1 italic">
              Your medical information is kept completely confidential and used only
              for health assessment. No third parties have access to this data.
            </p>
          </div>
        </div>
      </div>

      {/* Optional Note */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-xs text-gray-700">
          <span className="font-semibold">Eslatma:</span> Agar hozirgi paytda sizda bu kasalliklardan
          hech biri bo'lmasa, "Yo'q" ni tanlang va keyingisiga o'ting.
        </p>
        <p className="text-xs text-gray-500 italic mt-1">
          Note: If you currently don't have any of these conditions, select "No" and continue.
        </p>
      </div>
    </div>
  );
}
