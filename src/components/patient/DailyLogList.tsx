import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Droplets, Utensils, Activity, Pill, Heart, Trash2 } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

type LogEntry = {
  id: string;
  type: 'glucose' | 'meal' | 'activity' | 'medication' | 'feeling';
  timestamp: string;
  display: string;
  details: string;
};

type Props = {
  onUpdate: () => void;
};

import { API_CONFIG } from '../../lib/config';

const API_URL = API_CONFIG.BASE_URL;

export default function DailyLogList({ onUpdate }: Props) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadEntries();
  }, [days, user]);

  const loadEntries = async () => {
    if (!user) return;

    try {
      const startDate = new Date();
      
      if (days === 1) {
        // For "Today", start from beginning of today
        startDate.setHours(0, 0, 0, 0);
      } else {
        // For 7d, 30d, go back that many days from today
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
      }

      console.log(`Loading entries for ${days === 1 ? 'Today' : `Last ${days} days`} from:`, startDate.toISOString());

      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      const [glucose, meals, activities, medications, feelings] = await Promise.all([
        fetch(`${API_URL}/glucose-readings?patient_id=${user.id}&start_date=${startDate.toISOString()}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/meals?patient_id=${user.id}&start_date=${startDate.toISOString()}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/activities?patient_id=${user.id}&start_date=${startDate.toISOString()}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/medications?patient_id=${user.id}&start_date=${startDate.toISOString()}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/feelings?patient_id=${user.id}&start_date=${startDate.toISOString()}`, { headers }).then(r => r.json()),
      ]);

      const allEntries: LogEntry[] = [
        ...(glucose || []).map((g: any) => ({
          id: g.id,
          type: 'glucose' as const,
          timestamp: g.timestamp,
          display: `${g.value_mg_dl} mg/dL`,
          details: g.measurement_type || 'Random',
        })),
        ...(meals || []).map((m: any) => ({
          id: m.id,
          type: 'meal' as const,
          timestamp: m.timestamp,
          display: m.meal_name,
          details: m.carbs_g ? `${m.carbs_g}g carbs` : '',
        })),
        ...(activities || []).map((a: any) => ({
          id: a.id,
          type: 'activity' as const,
          timestamp: a.timestamp,
          display: a.activity_type.replace('_', ' '),
          details: `${a.duration_minutes} min, ${a.intensity}`,
        })),
        ...(medications || []).map((m: any) => ({
          id: m.id,
          type: 'medication' as const,
          timestamp: m.timestamp,
          display: m.medication_name,
          details: `${m.dose} - ${m.status}`,
        })),
        ...(feelings || []).map((f: any) => ({
          id: f.id,
          type: 'feeling' as const,
          timestamp: f.timestamp,
          display: `Mood level ${f.mood_level}`,
          details: f.note || '',
        })),
      ];

      allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEntries(allEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entry: LogEntry) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      const endpoints = {
        glucose: 'glucose-readings',
        meal: 'meals',
        activity: 'activities',
        medication: 'medications',
        feeling: 'feelings',
      };

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/${endpoints[entry.type]}/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete entry');

      loadEntries();
      onUpdate();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  const getIcon = (type: LogEntry['type']) => {
    const icons = {
      glucose: Droplets,
      meal: Utensils,
      activity: Activity,
      medication: Pill,
      feeling: Heart,
    };
    const Icon = icons[type];
    return <Icon className="w-5 h-5" />;
  };

  const getColor = (type: LogEntry['type']) => {
    const colors = {
      glucose: 'bg-red-100 text-red-700',
      meal: 'bg-orange-100 text-orange-700',
      activity: 'bg-green-100 text-green-700',
      medication: 'bg-blue-100 text-blue-700',
      feeling: 'bg-pink-100 text-pink-700',
    };
    return colors[type];
  };

  if (loading) {
    const loadingText = days === 1 ? "today's" : `last ${days} days'`;
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600">Loading {loadingText} entries...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Daily Log</h2>
          <div className="flex gap-2">
            {[1, 7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  days === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {d === 1 ? 'Today' : `${d}d`}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <div className="text-gray-400 mb-3">
            <Activity className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No entries found</h3>
          <p className="text-gray-600">Start logging your glucose, meals, and activities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Daily Log</h2>
        <div className="flex gap-2">
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                days === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {d === 1 ? 'Today' : `${d}d`}
            </button>
          ))}
        </div>
      </div>
      {entries.map((entry) => (
        <div
          key={`${entry.type}-${entry.id}`}
          className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 flex items-center gap-4"
        >
          <div className={`p-3 rounded-lg ${getColor(entry.type)}`}>
            {getIcon(entry.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{entry.display}</p>
            <p className="text-sm text-gray-600">{entry.details}</p>
            <p className="text-xs text-gray-500 mt-1">{formatDateTime(entry.timestamp)}</p>
          </div>
          <button
            onClick={() => handleDelete(entry)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete entry"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
}
