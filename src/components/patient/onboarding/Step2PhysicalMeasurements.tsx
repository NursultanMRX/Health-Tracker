import { Ruler, Weight } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { OnboardingFormData } from './OnboardingWizard';

interface Step2Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

// Step 2: Physical Measurements
// Design: Clean number inputs with real-time BMI calculation for immediate feedback
export default function Step2PhysicalMeasurements({ formData, updateFormData }: Step2Props) {
  const [bmi, setBmi] = useState<number | null>(null);

  // Calculate BMI whenever height or weight changes
  useEffect(() => {
    const height = parseFloat(formData.height_cm);
    const weight = parseFloat(formData.weight_kg);

    if (height > 0 && weight > 0) {
      // BMI = weight (kg) / (height (m))^2
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      setBmi(parseFloat(calculatedBmi.toFixed(1)));
    } else {
      setBmi(null);
    }
  }, [formData.height_cm, formData.weight_kg]);

  // Get BMI category and color
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { text: 'Ozg\'in / Underweight', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (bmi < 25) return { text: 'Normal / Normal', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (bmi < 30) return { text: 'Ortiqcha vazn / Overweight', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { text: 'Semizlik / Obese', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const bmiCategory = bmi ? getBmiCategory(bmi) : null;

  return (
    <div className="space-y-6">
      {/* Height Input */}
      <div>
        <label htmlFor="height" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Ruler className="w-4 h-4 text-[#3A86FF]" />
          Height (cm)
          <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">Your height in centimeters</p>
        <div className="relative">
          <input
            type="number"
            id="height"
            value={formData.height_cm}
            onChange={(e) => updateFormData({ height_cm: e.target.value })}
            placeholder="Example: 170"
            min="50"
            max="250"
            step="0.1"
            className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all text-base font-medium"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
            cm
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Between 50 cm and 250 cm
        </p>
      </div>

      {/* Weight Input */}
      <div>
        <label htmlFor="weight" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Weight className="w-4 h-4 text-[#3A86FF]" />
          Weight (kg)
          <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">Your weight in kilograms</p>
        <div className="relative">
          <input
            type="number"
            id="weight"
            value={formData.weight_kg}
            onChange={(e) => updateFormData({ weight_kg: e.target.value })}
            placeholder="Example: 70"
            min="20"
            max="300"
            step="0.1"
            className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all text-base font-medium"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
            kg
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Between 20 kg and 300 kg
        </p>
      </div>

      {/* BMI Calculator - Real-time feedback */}
      {bmi && bmiCategory && (
        <div className={`mt-6 p-5 ${bmiCategory.bg} border-2 ${bmiCategory.border} rounded-xl transition-all duration-300 animate-fadeIn`}>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <p className={`text-xl font-bold ${bmiCategory.color}`}>
                  {bmi}
                </p>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Sizning BMI (Tana massasi indeksi)
              </p>
              <p className={`text-base font-bold ${bmiCategory.color} mb-1`}>
                {bmiCategory.text}
              </p>
              <p className="text-xs text-gray-600">
                BMI avtomatik hisoblanadi va sizning sog'ligingizni baholashda ishlatiladi.
              </p>
              <p className="text-xs text-gray-500 italic mt-1">
                BMI is automatically calculated and used in your health assessment.
              </p>
            </div>
          </div>

          {/* BMI Scale Visual */}
          <div className="mt-4">
            <div className="h-2 bg-gradient-to-r from-yellow-400 via-green-400 via-orange-400 to-red-500 rounded-full relative">
              <div
                className="absolute w-3 h-3 bg-gray-900 rounded-full shadow-lg -top-0.5 transform -translate-x-1/2 transition-all duration-300"
                style={{
                  left: `${Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100)}%`
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>15</span>
              <span>40</span>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-[#3A86FF]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">
              Why are height and weight needed?
            </p>
            <p className="text-xs text-gray-600">
              Height and weight are used to calculate BMI (Body Mass Index).
              This metric plays an important role in diabetes prediction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
