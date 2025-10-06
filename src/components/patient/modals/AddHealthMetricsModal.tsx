import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { X, Activity, Utensils, Moon, Briefcase, Smartphone, Users, Smile, Droplets, Heart, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../../../lib/config';

type AddHealthMetricsModalProps = {
  onClose: () => void;
  onAdd: () => void;
  voiceData?: any;
};

export default function AddHealthMetricsModal({ onClose, onAdd, voiceData }: AddHealthMetricsModalProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    age: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    exercise_level: 'Moderate' as 'Low' | 'Moderate' | 'High',
    diet_type: 'Balanced' as 'Vegetarian' | 'Vegan' | 'Balanced' | 'Junk Food' | 'Keto',
    sleep_hours: '',
    stress_level: 'Moderate' as 'Low' | 'Moderate' | 'High',
    mental_health_condition: 'Anxiety' as 'Anxiety' | 'PTSD' | 'Depression' | 'Bipolar',
    work_hours_per_week: '',
    screen_time_per_day_hours: '',
    social_interaction_score: '',
    happiness_score: '',
    bmi: '',
    hypertension: false,
    heart_disease: false,
    hba1c_level: '',
    blood_glucose_level: '',
  });
  const [loading, setLoading] = useState(false);

  // Apply voice data when available
  useEffect(() => {
    if (voiceData) {
      console.log('Applying voice data to form:', voiceData);
      setFormData(prev => ({
        ...prev,
        ...(voiceData.work_hours_per_week !== null && voiceData.work_hours_per_week !== undefined && {
          work_hours_per_week: voiceData.work_hours_per_week.toString()
        }),
        ...(voiceData.social_interaction_score !== null && voiceData.social_interaction_score !== undefined && {
          social_interaction_score: voiceData.social_interaction_score.toString()
        }),
        ...(voiceData.happiness_score !== null && voiceData.happiness_score !== undefined && {
          happiness_score: voiceData.happiness_score.toString()
        }),
        ...(voiceData.blood_glucose_level !== null && voiceData.blood_glucose_level !== undefined && {
          blood_glucose_level: voiceData.blood_glucose_level.toString()
        }),
        ...(voiceData.screen_time_per_day_hours !== null && voiceData.screen_time_per_day_hours !== undefined && {
          screen_time_per_day_hours: voiceData.screen_time_per_day_hours.toString()
        }),
        ...(voiceData.hba1c_level !== null && voiceData.hba1c_level !== undefined && {
          hba1c_level: voiceData.hba1c_level.toString()
        }),
      }));
    }
  }, [voiceData]);

  // Auto-fetch tracked data from Railway API on mount
  useEffect(() => {
    const fetchTrackedData = async () => {
      // Only autofill for user with ID: 81f74fc9-6571-4e78-8d89-1695bf90b15d
      if (user?.id !== '30af11c8-568e-4bce-837c-c5dfb4f0833b') {
        return;
      }

      try {
        // Use proxy endpoint through our backend to avoid CORS issues
        const response = await fetch(buildApiUrl('/autofill/user_B'), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (!response.ok) {
          console.warn('Failed to fetch tracked data:', response.status);
          return;
        }

        const data = await response.json();
        console.log('Auto-filled tracked data:', data);

        // Map the API response to form fields
        // Clean up any trailing commas or whitespace
        const cleanString = (str: string) => str?.toString().replace(/,\s*$/, '').trim();

        setFormData(prev => ({
          ...prev,
          exercise_level: (cleanString(data.exercise_level) || prev.exercise_level) as 'Low' | 'Moderate' | 'High',
          sleep_hours: data.sleep_hours?.toString() || prev.sleep_hours,
          stress_level: (cleanString(data.stress_level) || prev.stress_level) as 'Low' | 'Moderate' | 'High',
          screen_time_per_day_hours: data.screen_time_per_day_hours?.toString() || prev.screen_time_per_day_hours,
        }));
      } catch (error) {
        console.error('Error auto-filling tracked data:', error);
      }
    };

    fetchTrackedData();
  }, [user?.id]);

  // Fetch last HbA1c level and other data from database
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!user?.id) return;

      try {
        // Fetch last health metrics for HbA1c
        const metricsResponse = await fetch(buildApiUrl(`/health-metrics?patient_id=${user.id}`), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (metricsResponse.ok) {
          const metrics = await metricsResponse.json();
          // Get the most recent record (already sorted by timestamp DESC on backend)
          if (metrics.length > 0 && metrics[0].hba1c_level) {
            setFormData(prev => ({
              ...prev,
              hba1c_level: metrics[0].hba1c_level.toString(),
            }));
            console.log('Auto-filled last HbA1c level:', metrics[0].hba1c_level);
          }
        }

        // Fetch onboarding data for age, bmi, gender
        const onboardingResponse = await fetch(buildApiUrl(`/onboarding/${user.id}`), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (onboardingResponse.ok) {
          const onboarding = await onboardingResponse.json();

          // Calculate age from date_of_birth
          let age = '';
          if (onboarding.date_of_birth) {
            const birthDate = new Date(onboarding.date_of_birth);
            const today = new Date();
            const calculatedAge = today.getFullYear() - birthDate.getFullYear();
            age = calculatedAge.toString();
          }

          // Calculate BMI from height and weight
          let bmi = '';
          if (onboarding.height_cm && onboarding.weight_kg) {
            const heightInMeters = onboarding.height_cm / 100;
            const calculatedBmi = onboarding.weight_kg / (heightInMeters * heightInMeters);
            bmi = calculatedBmi.toFixed(1);
          }

          // Set gender
          let gender = onboarding.gender || 'Female';
          // Capitalize first letter to match form options
          if (gender === 'male') gender = 'Male';
          if (gender === 'female') gender = 'Female';

          setFormData(prev => ({
            ...prev,
            age,
            bmi,
            gender: gender as 'Male' | 'Female' | 'Other',
          }));

          console.log('Auto-filled from onboarding:', { age, bmi, gender });
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };

    fetchPatientData();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for ML prediction
      const predictionData = {
        age: formData.age ? parseInt(formData.age) : 0,
        gender: formData.gender,
        exercise_level: formData.exercise_level,
        diet_type: formData.diet_type,
        sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : 0,
        stress_level: formData.stress_level,
        mental_health_condition: formData.mental_health_condition,
        work_hours_per_week: formData.work_hours_per_week ? Math.round(parseFloat(formData.work_hours_per_week)) : 0,
        screen_time_per_day_hours: formData.screen_time_per_day_hours ? parseFloat(formData.screen_time_per_day_hours) : 0,
        social_interaction_score: formData.social_interaction_score ? parseFloat(formData.social_interaction_score) : 0,
        happiness_score: formData.happiness_score ? parseFloat(formData.happiness_score) : 0,
        bmi: formData.bmi ? parseFloat(formData.bmi) : 0,
        hypertension: formData.hypertension ? 1 : 0,
        heart_disease: formData.heart_disease ? 1 : 0,
        hba1c_level: formData.hba1c_level ? parseFloat(formData.hba1c_level) : 0,
        blood_glucose_level: formData.blood_glucose_level ? parseInt(formData.blood_glucose_level) : 0,
      };

      // Call ML prediction API
      let predictionResult = {
        risk_probability: null,
        risk_percentage: null,
        risk_level: null,
        recommendation: null
      };

      try {
        console.log('Sending to ML API:', predictionData);

        const mlResponse = await fetch('https://mlserver-production.up.railway.app/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
          body: JSON.stringify(predictionData),
        });

        if (mlResponse.ok) {
          predictionResult = await mlResponse.json();
          console.log('ML Prediction:', predictionResult);
        } else {
          const errorText = await mlResponse.text();
          console.error('ML prediction failed:', mlResponse.status, errorText);
          console.warn('Continuing without risk assessment');
        }
      } catch (mlError) {
        console.error('ML API error:', mlError);
        console.warn('Continuing without risk assessment');
      }

      // Save to database with prediction results
      const response = await fetch(buildApiUrl('/health-metrics'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          patient_id: user?.id,
          ...predictionData,
          hypertension: formData.hypertension,
          heart_disease: formData.heart_disease,
          risk_probability: predictionResult.risk_probability,
          risk_percentage: predictionResult.risk_percentage,
          risk_level: predictionResult.risk_level,
          recommendation: predictionResult.recommendation,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to save health metrics');

      onAdd();
    } catch (error) {
      console.error('Error saving health metrics:', error);
      alert('Failed to save health metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t('logYourHealthDataTitle')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Exercise Level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Activity className="w-4 h-4" />
              {t('exerciseLevel')}
            </label>
            <select
              value={formData.exercise_level}
              onChange={(e) => setFormData({ ...formData, exercise_level: e.target.value as any })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Diet Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Utensils className="w-4 h-4" />
              {t('dietType')}
            </label>
            <select
              value={formData.diet_type}
              onChange={(e) => setFormData({ ...formData, diet_type: e.target.value as any })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Balanced">Balanced</option>
              <option value="Junk Food">Junk Food</option>
              <option value="Keto">Keto</option>
            </select>
          </div>

          {/* Sleep Hours */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Moon className="w-4 h-4" />
              {t('sleepHours')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="24"
              value={formData.sleep_hours}
              onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })}
              placeholder="e.g., 7.5"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Stress Level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Heart className="w-4 h-4" />
              {t('stressLevel')}
            </label>
            <select
              value={formData.stress_level}
              onChange={(e) => setFormData({ ...formData, stress_level: e.target.value as any })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Mental Health Condition */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Brain className="w-4 h-4" />
              {t('mentalHealthCondition')}
            </label>
            <select
              value={formData.mental_health_condition}
              onChange={(e) => setFormData({ ...formData, mental_health_condition: e.target.value as any })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Anxiety">Anxiety</option>
              <option value="PTSD">PTSD</option>
              <option value="Depression">Depression</option>
              <option value="Bipolar">Bipolar</option>
            </select>
          </div>

          {/* Work Hours Per Week */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Briefcase className="w-4 h-4" />
              {t('workHoursPerWeek')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="168"
              value={formData.work_hours_per_week}
              onChange={(e) => setFormData({ ...formData, work_hours_per_week: e.target.value })}
              placeholder={t('placeholder_e_g_40')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Screen Time Per Day */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Smartphone className="w-4 h-4" />
              {t('screenTimePerDay')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="24"
              value={formData.screen_time_per_day_hours}
              onChange={(e) => setFormData({ ...formData, screen_time_per_day_hours: e.target.value })}
              placeholder="e.g., 3.5"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Social Interaction Score */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Users className="w-4 h-4" />
              {t('socialInteractionScore')}
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={formData.social_interaction_score}
              onChange={(e) => setFormData({ ...formData, social_interaction_score: e.target.value })}
              placeholder={t('placeholder_e_g_8_5')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Happiness Score */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Smile className="w-4 h-4" />
              {t('happinessScore')}
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={formData.happiness_score}
              onChange={(e) => setFormData({ ...formData, happiness_score: e.target.value })}
              placeholder="e.g., 7.5"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* HbA1c Level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Droplets className="w-4 h-4" />
              {t('hba1cLevel')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={formData.hba1c_level}
              onChange={(e) => setFormData({ ...formData, hba1c_level: e.target.value })}
              placeholder="e.g., 5.4"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Blood Glucose Level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Droplets className="w-4 h-4" />
              {t('bloodGlucoseLevel')}
            </label>
            <input
              type="number"
              min="0"
              max="600"
              value={formData.blood_glucose_level}
              onChange={(e) => setFormData({ ...formData, blood_glucose_level: e.target.value })}
              placeholder="e.g., 95"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : t('saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
