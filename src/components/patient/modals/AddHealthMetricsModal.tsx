import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { X, Activity, Utensils, Moon, Briefcase, Smartphone, Users, Smile, Droplets, Heart, User, Brain, Scale, Stethoscope } from 'lucide-react';

type AddHealthMetricsModalProps = {
  onClose: () => void;
  onAdd: () => void;
};

export default function AddHealthMetricsModal({ onClose, onAdd }: AddHealthMetricsModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    age: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    exercise_level: 'Moderate' as 'Low' | 'Moderate' | 'High',
    diet_type: 'Balanced' as 'Vegetarian' | 'Vegan' | 'Balanced' | 'Junk Food' | 'Keto',
    sleep_hours: '',
    stress_level: 'Moderate' as 'Low' | 'Moderate' | 'High',
    mental_health_condition: 'None',
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
        work_hours_per_week: formData.work_hours_per_week ? parseFloat(formData.work_hours_per_week) : 0,
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
        const mlResponse = await fetch('https://263cd73778c1.ngrok-free.app/predict', {
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
          console.warn('ML prediction failed, continuing without risk assessment');
        }
      } catch (mlError) {
        console.warn('ML API unavailable, continuing without risk assessment:', mlError);
      }

      // Save to database with prediction results
      const response = await fetch('http://localhost:3001/api/health-metrics', {
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

      // Show success message with risk assessment if available
      if (predictionResult.risk_percentage) {
        alert(`Health data saved successfully!\n\nDiabetes Risk: ${predictionResult.risk_percentage}\nRisk Level: ${predictionResult.risk_level}\n\n${predictionResult.recommendation}`);
      }

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
          <h2 className="text-xl font-bold text-gray-900">Log Your Health Data</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Age */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <User className="w-4 h-4" />
              Age
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="e.g., 30"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <User className="w-4 h-4" />
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Exercise Level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Activity className="w-4 h-4" />
              Exercise Level
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
              Diet Type
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
              Sleep Hours (per day)
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
              Stress Level
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
              Mental Health Condition
            </label>
            <input
              type="text"
              value={formData.mental_health_condition}
              onChange={(e) => setFormData({ ...formData, mental_health_condition: e.target.value })}
              placeholder="e.g., None, Anxiety, Depression"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Work Hours Per Week */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Briefcase className="w-4 h-4" />
              Work Hours Per Week
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="168"
              value={formData.work_hours_per_week}
              onChange={(e) => setFormData({ ...formData, work_hours_per_week: e.target.value })}
              placeholder="e.g., 40"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Screen Time Per Day */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Smartphone className="w-4 h-4" />
              Screen Time Per Day (hours)
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
              Social Interaction Score (1-10)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={formData.social_interaction_score}
              onChange={(e) => setFormData({ ...formData, social_interaction_score: e.target.value })}
              placeholder="e.g., 8.5"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Happiness Score */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Smile className="w-4 h-4" />
              Happiness Score (1-10)
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

          {/* BMI */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Scale className="w-4 h-4" />
              BMI (Body Mass Index)
            </label>
            <input
              type="number"
              step="0.1"
              min="10"
              max="60"
              value={formData.bmi}
              onChange={(e) => setFormData({ ...formData, bmi: e.target.value })}
              placeholder="e.g., 22.5"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Health Conditions */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Stethoscope className="w-4 h-4" />
              Health Conditions
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hypertension}
                  onChange={(e) => setFormData({ ...formData, hypertension: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Hypertension</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.heart_disease}
                  onChange={(e) => setFormData({ ...formData, heart_disease: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Heart Disease</span>
              </label>
            </div>
          </div>

          {/* HbA1c Level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Droplets className="w-4 h-4" />
              HbA1c Level (%)
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
              Blood Glucose Level (mg/dL)
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Health Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
