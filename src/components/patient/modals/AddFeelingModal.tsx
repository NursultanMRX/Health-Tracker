import { useState } from 'react';
import { X, Save, Smile, Meh, Frown } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../lib/config';

type Props = {
  onClose: () => void;
  onAdd: () => void;
};

export default function AddFeelingModal({ onClose, onAdd }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [moodLevel, setMoodLevel] = useState<number>(3);
  const [note, setNote] = useState('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const moods = [
    { level: 1, emoji: '😌', label: t('modals.logFeeling.veryCalm'), color: 'bg-green-100 border-green-300 text-green-700' },
    { level: 2, emoji: '🙂', label: t('modals.logFeeling.calm'), color: 'bg-blue-100 border-blue-300 text-blue-700' },
    { level: 3, emoji: '😐', label: t('modals.logFeeling.neutral'), color: 'bg-gray-100 border-gray-300 text-gray-700' },
    { level: 4, emoji: '😰', label: t('modals.logFeeling.stressed'), color: 'bg-orange-100 border-orange-300 text-orange-700' },
    { level: 5, emoji: '😫', label: t('modals.logFeeling.veryStressed'), color: 'bg-red-100 border-red-300 text-red-700' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(buildApiUrl('/feelings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          patient_id: user.id,
          mood_level: moodLevel,
          timestamp: new Date(timestamp).toISOString(),
          note: note.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save feeling');
      }

      onAdd();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save feeling');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t('modals.logFeeling.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              {t('modals.logFeeling.selectMoodLabel')}
            </label>
            <div className="flex justify-between gap-2">
              {moods.map((mood) => (
                <label key={mood.level} className="flex-1">
                  <input
                    type="radio"
                    name="mood"
                    value={mood.level}
                    checked={moodLevel === mood.level}
                    onChange={() => setMoodLevel(mood.level)}
                    className="sr-only peer"
                  />
                  <div
                    className={`p-4 border-2 rounded-xl text-center cursor-pointer transition-all ${
                      moodLevel === mood.level
                        ? mood.color
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{mood.emoji}</div>
                    <div className="text-xs font-medium">{mood.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="feeling-timestamp" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.timeLabel')}
            </label>
            <input
              id="feeling-timestamp"
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="feeling-note" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.optionalNoteLabel')}
            </label>
            <textarea
              id="feeling-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder={t('modals.logFeeling.describeFeelingPlaceholder')}
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
            {saving ? 'Saving...' : t('buttons.saveFeeling')}
          </button>
        </form>
      </div>
    </div>
  );
}
