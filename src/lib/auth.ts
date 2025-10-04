import { db, booleanToSqlite, sqliteToBoolean } from './db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'doctor';
};

export type Session = {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
};

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Sign up a new user
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: 'patient' | 'doctor'
) {
  const userId = uuidv4();
  const passwordHash = await hashPassword(password);

  try {
    // Insert user profile
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, email, passwordHash, fullName, role);

    // If patient, create default settings
    if (role === 'patient') {
      const settingsId = uuidv4();
      db.prepare(`
        INSERT INTO patient_settings (id, patient_id)
        VALUES (?, ?)
      `).run(settingsId, userId);
    }

    return { user: { id: userId, email, full_name: fullName, role } };
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Email already exists');
    }
    throw error;
  }
}

// Sign in a user
export async function signIn(email: string, password: string) {
  const user = db.prepare(`
    SELECT id, email, password_hash, full_name, role
    FROM profiles
    WHERE email = ?
  `).get(email) as any;

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Create session
  const sessionId = uuidv4();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, user.id, token, expiresAt);

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
    session: {
      id: sessionId,
      user_id: user.id,
      token,
      expires_at: expiresAt,
    },
  };
}

// Get user from session token
export function getUserFromToken(token: string) {
  const result = db.prepare(`
    SELECT p.id, p.email, p.full_name, p.role, s.expires_at
    FROM sessions s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
  `).get(token) as any;

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    email: result.email,
    full_name: result.full_name,
    role: result.role,
  };
}

// Sign out (delete session)
export function signOut(token: string) {
  db.prepare(`
    DELETE FROM sessions WHERE token = ?
  `).run(token);
}

// Get user profile by ID
export function getUserProfile(userId: string) {
  return db.prepare(`
    SELECT id, email, full_name, role, date_of_birth, sex, clinic_location,
           primary_care_physician_id, created_at, updated_at
    FROM profiles
    WHERE id = ?
  `).get(userId);
}

// Clean up expired sessions
export function cleanupExpiredSessions() {
  db.prepare(`
    DELETE FROM sessions WHERE datetime(expires_at) <= datetime('now')
  `).run();
}
