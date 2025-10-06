import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { sqliteClient } from '../../../lib/sqlite-client';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../../../lib/config';

type Props = {
  onClose: () => void;
  onAdd: () => void;
  preselectedType?: string;
};

export default function AddGlucoseModal({ onClose, onAdd, preselectedType }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [type, setType] = useState<string>(preselectedType || 'random');
  const [note, setNote] = useState('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const measurementTypes = [
    { value: 'breakfast', label: t('modals.logGlucose.breakfast') },
    { value: 'lunch', label: t('modals.logGlucose.lunch') },
    { value: 'dinner', label: t('modals.logGlucose.dinner') },
    { value: 'bedtime', label: t('modals.logGlucose.bedtime') },
    { value: 'before_exercise', label: t('modals.logGlucose.beforeExercise') },
    { value: 'fasting', label: t('modals.logGlucose.fasting') },
    { value: 'random', label: t('modals.logGlucose.random') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const glucoseValue = parseInt(value);
    if (isNaN(glucoseValue) || glucoseValue < 20 || glucoseValue > 600) {
      setError('Please enter a valid glucose value between 20 and 600 mg/dL');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(buildApiUrl('/glucose-readings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          patient_id: user.id,
          value_mg_dl: glucoseValue,
          measurement_type: type,
          timestamp: new Date(timestamp).toISOString(),
          note: note.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save reading');
      }

      onAdd();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reading');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{t('modals.logGlucose.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="glucose-value" className="block text-sm font-medium text-gray-700 mb-2">
                {t('modals.logGlucose.readingLabel')}
              </label>
              <div className="relative">
                <input
                  id="glucose-value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-4 py-4 text-3xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  placeholder="104"
                  required
                  min="20"
                  max="600"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-500">
                  {t('mgdl')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('modals.logGlucose.measurementQuestion')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {measurementTypes.map((mt) => (
                  <label key={mt.value} className="relative">
                    <input
                      type="radio"
                      name="measurement-type"
                      value={mt.value}
                      checked={type === mt.value}
                      onChange={(e) => setType(e.target.value)}
                      className="sr-only peer"
                    />
                    <div className="p-3 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors">
                      <span className="text-sm font-medium">{mt.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.timeLabel')}
              </label>
              <input
                id="timestamp"
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.optionalNoteLabel')}
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder={t('common.addNotePlaceholder')}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex-shrink-0">
          <button
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-medium text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : t('buttons.saveReading')}
          </button>
        </div>
      </div>
    </div>
  );
}
