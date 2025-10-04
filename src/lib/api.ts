// API wrapper for SQLite database operations
// This provides a Supabase-like interface for easier migration

import { db, sqliteToBoolean, booleanToSqlite } from './db';
import { v4 as uuidv4 } from 'uuid';
import type {
  Profile,
  PatientSettings,
  GlucoseReading,
  Meal,
  Medication,
  Activity,
  Feeling,
  Reminder,
  ClinicalAlert,
} from './types';

// Session management (stored in localStorage on client side)
let currentToken: string | null = null;
let currentUser: any | null = null;

export function setAuthToken(token: string | null) {
  currentToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken(): string | null {
  if (!currentToken) {
    currentToken = localStorage.getItem('auth_token');
  }
  return currentToken;
}

export function setCurrentUser(user: any | null) {
  currentUser = user;
}

export function getCurrentUser() {
  return currentUser;
}

// Profiles operations
export const profilesApi = {
  select: (columns: string = '*') => ({
    eq: (field: string, value: any) => ({
      single: async () => {
        const stmt = db.prepare(`SELECT ${columns} FROM profiles WHERE ${field} = ?`);
        const data = stmt.get(value) as any;
        return { data, error: null };
      },
      maybeSingle: async () => {
        const stmt = db.prepare(`SELECT ${columns} FROM profiles WHERE ${field} = ?`);
        const data = stmt.get(value) as any;
        return { data, error: null };
      },
    }),
    order: (field: string, options: { ascending: boolean }) => ({
      then: async (resolve: any) => {
        const order = options.ascending ? 'ASC' : 'DESC';
        const stmt = db.prepare(`SELECT ${columns} FROM profiles ORDER BY ${field} ${order}`);
        const data = stmt.all() as any[];
        resolve({ data, error: null });
      },
    }),
  }),
};

// Patient settings operations
export const patientSettingsApi = {
  select: (columns: string = '*') => ({
    eq: (field: string, value: any) => ({
      maybeSingle: async () => {
        const stmt = db.prepare(`SELECT ${columns} FROM patient_settings WHERE ${field} = ?`);
        const rawData = stmt.get(value) as any;
        if (!rawData) return { data: null, error: null };

        // Convert SQLite integers to booleans
        const data: PatientSettings = {
          ...rawData,
          large_text_enabled: sqliteToBoolean(rawData.large_text_enabled),
          high_contrast_enabled: sqliteToBoolean(rawData.high_contrast_enabled),
          voice_guidance_enabled: sqliteToBoolean(rawData.voice_guidance_enabled),
          data_sharing_enabled: sqliteToBoolean(rawData.data_sharing_enabled),
        };
        return { data, error: null };
      },
    }),
  }),

  update: (updates: Partial<PatientSettings>) => ({
    eq: (field: string, value: any) => ({
      select: () => ({
        single: async () => {
          const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
          const values = Object.values(updates).map(v =>
            typeof v === 'boolean' ? booleanToSqlite(v) : v
          );

          db.prepare(`
            UPDATE patient_settings
            SET ${fields}, updated_at = datetime('now')
            WHERE ${field} = ?
          `).run(...values, value);

          // Fetch updated record
          const rawData = db.prepare('SELECT * FROM patient_settings WHERE patient_id = ?').get(value) as any;
          const data: PatientSettings = {
            ...rawData,
            large_text_enabled: sqliteToBoolean(rawData.large_text_enabled),
            high_contrast_enabled: sqliteToBoolean(rawData.high_contrast_enabled),
            voice_guidance_enabled: sqliteToBoolean(rawData.voice_guidance_enabled),
            data_sharing_enabled: sqliteToBoolean(rawData.data_sharing_enabled),
          };
          return { data, error: null };
        },
      }),
    }),
  }),

  insert: (records: any[]) => {
    const record = records[0];
    const id = record.id || uuidv4();

    db.prepare(`
      INSERT INTO patient_settings (id, patient_id)
      VALUES (?, ?)
    `).run(id, record.patient_id);

    return { data: { id }, error: null };
  },
};

// Clinical alerts operations
export const clinicalAlertsApi = {
  select: (columns: string = '*') => ({
    in: (field: string, values: any[]) => ({
      eq: (statusField: string, statusValue: any) => {
        const placeholders = values.map(() => '?').join(',');
        const stmt = db.prepare(`
          SELECT ${columns} FROM clinical_alerts
          WHERE ${field} IN (${placeholders}) AND ${statusField} = ?
        `);
        return {
          then: async (resolve: any) => {
            const data = stmt.all(...values, statusValue);
            resolve({ data, error: null });
          },
        };
      },
    }),
  }),
};

// Generic table operations
export function createTableApi(tableName: string) {
  return {
    select: (columns: string = '*') => ({
      eq: (field: string, value: any) => ({
        order: (orderField: string, options: { ascending: boolean }) => {
          const order = options.ascending ? 'ASC' : 'DESC';
          return {
            then: async (resolve: any) => {
              const stmt = db.prepare(`
                SELECT ${columns} FROM ${tableName}
                WHERE ${field} = ?
                ORDER BY ${orderField} ${order}
              `);
              const data = stmt.all(value);
              resolve({ data, error: null });
            },
          };
        },
        limit: (limitValue: number) => ({
          then: async (resolve: any) => {
            const stmt = db.prepare(`
              SELECT ${columns} FROM ${tableName}
              WHERE ${field} = ?
              LIMIT ?
            `);
            const data = stmt.all(value, limitValue);
            resolve({ data, error: null });
          },
        }),
      }),
    }),

    insert: (records: any[]) => {
      const record = records[0];
      const id = record.id || uuidv4();
      const keys = Object.keys(record);
      const values = Object.values(record);

      const placeholders = keys.map(() => '?').join(',');

      db.prepare(`
        INSERT INTO ${tableName} (id, ${keys.join(',')})
        VALUES (?, ${placeholders})
      `).run(id, ...values);

      return { data: { id }, error: null };
    },

    update: (updates: any) => ({
      eq: (field: string, value: any) => {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        db.prepare(`
          UPDATE ${tableName}
          SET ${fields}
          WHERE ${field} = ?
        `).run(...values, value);

        return { data: {}, error: null };
      },
    }),

    delete: () => ({
      eq: (field: string, value: any) => {
        db.prepare(`DELETE FROM ${tableName} WHERE ${field} = ?`).run(value);
        return { data: {}, error: null };
      },
    }),
  };
}

export const api = {
  from: (tableName: string) => {
    if (tableName === 'profiles') return profilesApi;
    if (tableName === 'patient_settings') return patientSettingsApi;
    if (tableName === 'clinical_alerts') return clinicalAlertsApi;
    return createTableApi(tableName);
  },
};
