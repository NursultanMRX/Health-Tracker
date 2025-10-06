import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../lib/config';

type Props = {
  onClose: () => void;
  onAdd: () => void;
};

export default function AddMealModal({ onClose, onAdd }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [mealName, setMealName] = useState('');
  const [carbs, setCarbs] = useState('');
  const [portion, setPortion] = useState<'small' | 'medium' | 'large'>('medium');
  const [note, setNote] = useState('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(buildApiUrl('/meals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          patient_id: user.id,
          meal_name: mealName,
          carbs_g: carbs ? parseInt(carbs) : 0,
          portion_size: portion,
          timestamp: new Date(timestamp).toISOString(),
          note: note.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save meal');
      }

      onAdd();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meal');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t('modals.logMeal.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="meal-name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('modals.logMeal.whatDidYouEatLabel')}
            </label>
            <input
              id="meal-name"
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('modals.logMeal.whatDidYouEatPlaceholder')}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('modals.logMeal.portionSizeLabel')}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <label key={size}>
                  <input
                    type="radio"
                    name="portion"
                    value={size}
                    checked={portion === size}
                    onChange={() => setPortion(size)}
                    className="sr-only peer"
                  />
                  <div className="p-3 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors capitalize">
                    {t(`modals.logMeal.${size}`)}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 mb-2">
              {t('modals.logMeal.carbohydratesLabel')}
            </label>
            <div className="relative">
              <input
                id="carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30"
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                {t('modals.logMeal.grams')}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="meal-timestamp" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.timeLabel')}
            </label>
            <input
              id="meal-timestamp"
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="meal-note" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.optionalNoteLabel')}
            </label>
            <textarea
              id="meal-note"
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

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-medium text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : t('buttons.saveMeal')}
          </button>
        </form>
      </div>
    </div>
  );
}
