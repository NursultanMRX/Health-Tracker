import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { PatientSettings } from '../lib/types';
import { useAuth } from './AuthContext';

type SettingsContextType = {
  settings: PatientSettings | null;
  loading: boolean;
  updateSettings: (updates: Partial<PatientSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<PatientSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'patient') {
      loadSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (settings) {
      document.documentElement.setAttribute('data-large-text', settings.large_text_enabled.toString());
      document.documentElement.setAttribute('data-high-contrast', settings.high_contrast_enabled.toString());
    }
  }, [settings]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:3001/api/patient-settings/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else if (response.status === 404) {
        // Settings not found, that's okay
        setSettings(null);
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<PatientSettings>) => {
    if (!user || !settings) return;

    try {
      const response = await fetch(`http://localhost:3001/api/patient-settings/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
