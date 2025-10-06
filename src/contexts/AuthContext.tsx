import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sqliteClient } from '../lib/sqlite-client';
import type { Profile } from '../lib/types';
import { buildApiUrl } from '../lib/config';

type User = {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'doctor';
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'patient' | 'doctor', age?: string, gender?: 'male' | 'female', assignedDoctorId?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileCompletion: () => Promise<void>; // Mark profile as complete after onboarding
  refreshProfile: () => Promise<void>; // Reload profile from backend
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sqliteClient.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user as User | null;
      setUser(user ?? null);
      if (user) {
        loadProfile(user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = sqliteClient.auth.onAuthStateChange((_event: any, session: any) => {
      const user = session?.user as User | null;
      console.log('Auth state change:', user?.email || 'no user');

      setUser(user ?? null);
      if (user) {
        loadProfile(user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      // Fetch profile directly from the API
      const response = await fetch(buildApiUrl(`/profiles/${userId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        console.error('Error loading profile:', response.statusText);
        setProfile(null);
        return;
      }

      const data = await response.json();

      // Convert SQLite integer to boolean for is_profile_complete
      if (data) {
        setProfile({
          ...data,
          is_profile_complete: data.is_profile_complete === 1,
        });
        console.log('Profile loaded:', { is_profile_complete: data.is_profile_complete === 1 });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'patient' | 'doctor', age?: string, gender?: 'male' | 'female', assignedDoctorId?: string) => {
    const { error } = await sqliteClient.auth.signUp(
      { email, password },
      fullName,
      role,
      age,
      gender,
      assignedDoctorId
    );

    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await sqliteClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Set user and load profile
    if (data.user) {
      setUser(data.user as User);
      await loadProfile(data.user.id);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setProfile(null);
      setLoading(false);

      const { error } = await sqliteClient.auth.signOut();

      if (error) {
        console.warn('Sign out error (but continuing with local cleanup):', error);
      }

      localStorage.clear();
    } catch (error) {
      console.warn('Sign out error (but continuing with local cleanup):', error);
      setUser(null);
      setProfile(null);
      setLoading(false);
      localStorage.clear();
    }
  };

  // Update profile completion status in backend
  const updateProfileCompletion = async () => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      // Make direct API call to update profile completion
      const response = await fetch(buildApiUrl(`/profiles/${user.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ is_profile_complete: true }),
      });

      if (!response.ok) {
        // Try to parse error as JSON, but handle HTML responses gracefully
        let errorMessage = 'Failed to update profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // Response was not JSON (likely HTML error page)
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Refresh the local profile state
      await refreshProfile();
    } catch (error) {
      console.error('Failed to update profile completion:', error);
      throw error;
    }
  };

  // Reload profile from backend (useful after updates)
  const refreshProfile = async () => {
    if (!user) {
      throw new Error('No user logged in');
    }

    await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfileCompletion,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
