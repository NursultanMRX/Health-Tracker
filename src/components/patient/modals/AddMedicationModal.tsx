import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

type Props = {
  onClose: () => void;
  onAdd: () => void;
};

export default function AddMedicationModal({ onClose, onAdd }: Props) {
  const { user } = useAuth();
  const [medicationName, setMedicationName] = useState('');
  const [dose, setDose] = useState('');
  const [status, setStatus] = useState<'taken' | 'missed' | 'delayed'>('taken');
  const [missedReason, setMissedReason] = useState<'forgot' | 'busy' | 'side_effects' | ''>('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          patient_id: user.id,
          medication_name: medicationName,
          dose,
          status,
          missed_reason: missedReason || null,
          timestamp: new Date(timestamp).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save medication');
      }

      onAdd();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save medication');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Log Medicine</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="med-name" className="block text-sm font-medium text-gray-700 mb-2">
              Medication Name
            </label>
            <input
              id="med-name"
              type="text"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Metformin"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="dose" className="block text-sm font-medium text-gray-700 mb-2">
              Dose
            </label>
            <input
              id="dose"
              type="text"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 500 mg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(['taken', 'missed', 'delayed'] as const).map((s) => (
                <label key={s}>
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="sr-only peer"
                  />
                  <div className="p-3 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors capitalize">
                    {s}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {status === 'missed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for missing</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'forgot', label: 'Forgot' },
                  { value: 'busy', label: 'Too busy' },
                  { value: 'side_effects', label: 'Side effects' },
                ].map((reason) => (
                  <label key={reason.value}>
                    <input
                      type="radio"
                      name="missed-reason"
                      value={reason.value}
                      checked={missedReason === reason.value}
                      onChange={() => setMissedReason(reason.value as typeof missedReason)}
                      className="sr-only peer"
                    />
                    <div className="p-3 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors">
                      <span className="text-sm font-medium">{reason.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="med-timestamp" className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              id="med-timestamp"
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
            {saving ? 'Saving...' : 'Save Medication'}
          </button>
        </form>
      </div>
    </div>
  );
}
