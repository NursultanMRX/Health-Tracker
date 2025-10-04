import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  onClose: () => void;
};

export default function PatientSettings({ onClose }: Props) {
  const { profile } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [largeText, setLargeText] = useState(settings?.large_text_enabled ?? true);
  const [highContrast, setHighContrast] = useState(settings?.high_contrast_enabled ?? false);
  const [glucoseUnit, setGlucoseUnit] = useState(settings?.glucose_unit ?? 'mg/dL');
  const [targetLow, setTargetLow] = useState(settings?.target_low?.toString() ?? '70');
  const [targetHigh, setTargetHigh] = useState(settings?.target_high?.toString() ?? '180');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await updateSettings({
        large_text_enabled: largeText,
        high_contrast_enabled: highContrast,
        glucose_unit: glucoseUnit as 'mg/dL' | 'mmol/L',
        target_low: parseInt(targetLow),
        target_high: parseInt(targetHigh),
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Profile</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <span className="text-gray-600">Name:</span>{' '}
                <span className="font-medium text-gray-900">{profile?.full_name}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-600">Email:</span>{' '}
                <span className="font-medium text-gray-900">{profile?.email}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-600">Role:</span>{' '}
                <span className="font-medium text-gray-900 capitalize">{profile?.role}</span>
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Units</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Glucose Unit
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['mg/dL', 'mmol/L'] as const).map((unit) => (
                <label key={unit}>
                  <input
                    type="radio"
                    name="unit"
                    value={unit}
                    checked={glucoseUnit === unit}
                    onChange={() => setGlucoseUnit(unit)}
                    className="sr-only peer"
                  />
                  <div className="p-3 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors">
                    {unit}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Target Ranges</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="target-low" className="block text-sm font-medium text-gray-700 mb-2">
                  Low
                </label>
                <input
                  id="target-low"
                  type="number"
                  value={targetLow}
                  onChange={(e) => setTargetLow(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="50"
                  max="100"
                />
              </div>
              <div>
                <label htmlFor="target-high" className="block text-sm font-medium text-gray-700 mb-2">
                  High
                </label>
                <input
                  id="target-high"
                  type="number"
                  value={targetHigh}
                  onChange={(e) => setTargetHigh(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="140"
                  max="250"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Target range: {targetLow}-{targetHigh} {glucoseUnit}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Accessibility</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <span className="font-medium text-gray-900">Large Text</span>
                <input
                  type="checkbox"
                  checked={largeText}
                  onChange={(e) => setLargeText(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <span className="font-medium text-gray-900">High Contrast</span>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Data & Privacy</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Your data is encrypted and stored securely. You can export or delete your data at any time.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">Settings saved successfully!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-medium text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
