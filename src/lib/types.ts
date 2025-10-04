export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'doctor';
  age?: number;
  date_of_birth?: string;
  sex?: 'male' | 'female';
  clinic_location?: string;
  primary_care_physician_id?: string;
  is_profile_complete?: boolean; // Backend-driven flag for onboarding completion
  created_at: string;
  updated_at: string;
};

export type PatientSettings = {
  id: string;
  patient_id: string;
  glucose_unit: 'mg/dL' | 'mmol/L';
  target_low: number;
  target_high: number;
  large_text_enabled: boolean;
  high_contrast_enabled: boolean;
  voice_guidance_enabled: boolean;
  data_sharing_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type GlucoseReading = {
  id: string;
  patient_id: string;
  timestamp: string;
  value_mg_dl: number;
  measurement_type?: 'prebreakfast' | 'postprandial' | 'fasting' | 'random' | 'bedtime';
  tags?: string[];
  note?: string;
  created_at: string;
};

export type Meal = {
  id: string;
  patient_id: string;
  timestamp: string;
  meal_name: string;
  carbs_g?: number;
  protein_g?: number;
  fat_g?: number;
  portion_size?: 'small' | 'medium' | 'large';
  photo_url?: string;
  note?: string;
  created_at: string;
};

export type Medication = {
  id: string;
  patient_id: string;
  timestamp: string;
  medication_name: string;
  dose: string;
  status: 'taken' | 'missed' | 'delayed';
  missed_reason?: 'forgot' | 'busy' | 'side_effects';
  note?: string;
  created_at: string;
};

export type Activity = {
  id: string;
  patient_id: string;
  timestamp: string;
  activity_type: 'walk' | 'brisk_walk' | 'jog' | 'household_chores' | 'gym';
  duration_minutes: number;
  intensity: 'low' | 'medium' | 'high';
  note?: string;
  created_at: string;
};

export type Feeling = {
  id: string;
  patient_id: string;
  timestamp: string;
  mood_level: number;
  note?: string;
  created_at: string;
};

export type Reminder = {
  id: string;
  patient_id: string;
  reminder_type: 'medication' | 'glucose_check' | 'appointment';
  medication_name?: string;
  time: string;
  repeat_pattern: 'daily' | 'weekdays' | 'custom';
  custom_days?: number[];
  enabled: boolean;
  snooze_minutes: number;
  created_at: string;
};

export type ClinicalAlert = {
  id: string;
  patient_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggested_action?: string;
  detected_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  status: 'active' | 'acknowledged' | 'snoozed' | 'resolved';
  created_at: string;
};
