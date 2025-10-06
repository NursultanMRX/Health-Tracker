// API Configuration
export const API_CONFIG = {
  // Get API URL from environment variable or default to production backend
  BASE_URL: import.meta.env.VITE_API_URL || 'https://health-tracker-production-598b.up.railway.app/api',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      SIGNUP: '/auth/signup',
      SIGNIN: '/auth/signin',
      SIGNOUT: '/auth/signout',
      SESSION: '/auth/session',
    },
    PROFILES: {
      LIST: '/profiles',
      GET: (id: string) => `/profiles/${id}`,
      UPDATE: (id: string) => `/profiles/${id}`,
    },
    DOCTORS: '/doctors',
    PATIENT_SETTINGS: (patientId: string) => `/patient-settings/${patientId}`,
    HEALTH_METRICS: '/health-metrics',
    GLUCOSE_READINGS: '/glucose-readings',
    MEALS: '/meals',
    MEDICATIONS: '/medications',
    ACTIVITIES: '/activities',
    FEELINGS: '/feelings',
    CLINICAL_ALERTS: '/clinical-alerts',
    ONBOARDING: '/onboarding',
    AUTOFILL: '/autofill',
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Environment configuration
export const ENV_CONFIG = {
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  API_URL: import.meta.env.VITE_API_URL,
};
