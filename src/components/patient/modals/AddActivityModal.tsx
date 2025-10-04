import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

type Props = {
  onClose: () => void;
  onAdd: () => void;
};

export default function AddActivityModal({ onClose, onAdd }: Props) {
  const { user } = useAuth();
  const [activityType, setActivityType] = useState<'walk' | 'brisk_walk' | 'jog' | 'household_chores' | 'gym'>('walk');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('low');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activities = [
    { value: 'walk', label: 'Walk' },
    { value: 'brisk_walk', label: 'Brisk Walk' },
    { value: 'jog', label: 'Jog' },
    { value: 'household_chores', label: 'Household Chores' },
    { value: 'gym', label: 'Gym' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          patient_id: user.id,
          activity_type: activityType,
          duration_minutes: parseInt(duration),
          intensity,
          timestamp: new Date(timestamp).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save activity');
      }

      onAdd();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save activity');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Log Activity</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
            <div className="grid grid-cols-2 gap-2">
              {activities.map((activity) => (
                <label key={activity.value}>
                  <input
                    type="radio"
                    name="activity"
                    value={activity.value}
                    checked={activityType === activity.value}
                    onChange={() => setActivityType(activity.value as typeof activityType)}
                    className="sr-only peer"
                  />
                  <div className="p-3 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors">
                    <span className="text-sm font-medium">{activity.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <div className="relative">
              <input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30"
                required
                min="1"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                minutes
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Intensity</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <label key={level}>
                  <input
                    type="radio"
                    name="intensity"
                    value={level}
                    checked={intensity === level}
                    onChange={() => setIntensity(level)}
                    className="sr-only peer"
                  />
                  <div className="p-3 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors capitalize">
                    {level}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="activity-timestamp" className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              id="activity-timestamp"
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            {saving ? 'Saving...' : 'Save Activity'}
          </button>
        </form>
      </div>
    </div>
  );
}
