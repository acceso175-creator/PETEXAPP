// Auth Service - Mock Implementation
// TODO: Replace with Supabase Auth

import type { User } from '@/types';
import { mockUsers } from '@/lib/mock-data';

const STORAGE_KEY = 'petex_auth_user';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Mock credentials for testing
const MOCK_CREDENTIALS = {
  'carlos@petex.mx': { password: 'admin123', userId: 'admin-001' },
  'maria@petex.mx': { password: 'admin123', userId: 'admin-002' },
  '+52 614 111 2222': { password: 'driver123', userId: 'driver-001' },
  '+52 614 333 4444': { password: 'driver123', userId: 'driver-002' },
  '+52 614 555 6666': { password: 'driver123', userId: 'driver-003' },
};

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  // TODO: Replace with Supabase signInWithPassword or signInWithOtp
  await delay(800); // Simulate network

  const identifier = credentials.email || credentials.phone || '';
  const mockCred = MOCK_CREDENTIALS[identifier as keyof typeof MOCK_CREDENTIALS];

  if (!mockCred) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  if (mockCred.password !== credentials.password) {
    return { success: false, error: 'Contraseña incorrecta' };
  }

  const user = mockUsers.find(u => u.id === mockCred.userId);

  if (!user) {
    return { success: false, error: 'Error interno' };
  }

  if (!user.active) {
    return { success: false, error: 'Usuario desactivado' };
  }

  // Store in localStorage (mock session)
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  return { success: true, user };
}

export async function logout(): Promise<void> {
  // TODO: Replace with Supabase signOut
  await delay(300);

  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  // TODO: Replace with Supabase getSession
  await delay(100);

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function checkSession(): Promise<boolean> {
  // TODO: Replace with Supabase session check
  const user = await getCurrentUser();
  return user !== null;
}

// Quick login for demo purposes
export async function quickLogin(role: 'admin' | 'driver'): Promise<AuthResponse> {
  const user = mockUsers.find(u => u.role === role && u.active);

  if (!user) {
    return { success: false, error: 'No hay usuarios disponibles' };
  }

  await delay(500);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  return { success: true, user };
}
