import type { User } from '@/types';
import { mockUsers } from '@/lib/mock-data';

const STORAGE_KEY = 'petex_auth_user';
const CREDENTIALS_STORAGE_KEY = 'petex_auth_credentials';
const RESET_REQUESTS_STORAGE_KEY = 'petex_auth_reset_requests';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

type StoredCredential = {
  password: string;
  userId: string;
};

type CredentialMap = Record<string, StoredCredential>;

const DEFAULT_CREDENTIALS: CredentialMap = {
  'carlos@petex.mx': { password: 'admin123', userId: 'admin-001' },
  'maria@petex.mx': { password: 'admin123', userId: 'admin-002' },
  '+52 614 111 2222': { password: 'driver123', userId: 'driver-001' },
  '+52 614 333 4444': { password: 'driver123', userId: 'driver-002' },
  '+52 614 555 6666': { password: 'driver123', userId: 'driver-003' },
};

const getCredentialStore = (): CredentialMap => {
  if (typeof window === 'undefined') {
    return DEFAULT_CREDENTIALS;
  }

  const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
    return DEFAULT_CREDENTIALS;
  }

  try {
    return JSON.parse(stored) as CredentialMap;
  } catch {
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
    return DEFAULT_CREDENTIALS;
  }
};

const setCredentialStore = (credentials: CredentialMap) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
  }
};

const getUserById = (userId: string) => mockUsers.find(u => u.id === userId) ?? null;

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  await delay(500);

  const identifier = (credentials.email || credentials.phone || '').trim();
  const credentialStore = getCredentialStore();
  const storedCredential = credentialStore[identifier];

  if (!storedCredential) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  if (storedCredential.password !== credentials.password) {
    return { success: false, error: 'Contraseña incorrecta' };
  }

  const user = getUserById(storedCredential.userId);

  if (!user) {
    return { success: false, error: 'Error interno: usuario no disponible' };
  }

  if (!user.active) {
    return { success: false, error: 'Usuario desactivado' };
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  return { success: true, user };
}

export async function signup(credentials: SignupCredentials): Promise<AuthResponse> {
  await delay(700);

  const normalizedEmail = credentials.email.trim().toLowerCase();
  const credentialStore = getCredentialStore();

  if (credentialStore[normalizedEmail]) {
    return { success: false, error: 'Este correo ya está registrado' };
  }

  const newUser: User = {
    id: `driver-${crypto.randomUUID().slice(0, 8)}`,
    name: credentials.name.trim(),
    role: 'driver',
    email: normalizedEmail,
    active: true,
  };

  mockUsers.push(newUser);

  credentialStore[normalizedEmail] = {
    userId: newUser.id,
    password: credentials.password,
  };
  setCredentialStore(credentialStore);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  }

  return { success: true, user: newUser };
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  await delay(450);

  const normalizedEmail = email.trim().toLowerCase();
  const credentialStore = getCredentialStore();

  if (!credentialStore[normalizedEmail]) {
    return { success: false, error: 'No existe una cuenta con ese correo' };
  }

  if (typeof window !== 'undefined') {
    const currentReset = localStorage.getItem(RESET_REQUESTS_STORAGE_KEY);
    const resetStore = currentReset ? (JSON.parse(currentReset) as Record<string, string>) : {};
    resetStore[normalizedEmail] = new Date().toISOString();
    localStorage.setItem(RESET_REQUESTS_STORAGE_KEY, JSON.stringify(resetStore));
  }

  return { success: true };
}

export async function resetPassword(email: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  await delay(500);

  const normalizedEmail = email.trim().toLowerCase();
  const credentialStore = getCredentialStore();

  if (!credentialStore[normalizedEmail]) {
    return { success: false, error: 'No existe una cuenta con ese correo' };
  }

  credentialStore[normalizedEmail] = {
    ...credentialStore[normalizedEmail],
    password: newPassword,
  };
  setCredentialStore(credentialStore);

  if (typeof window !== 'undefined') {
    const currentReset = localStorage.getItem(RESET_REQUESTS_STORAGE_KEY);
    if (currentReset) {
      const resetStore = JSON.parse(currentReset) as Record<string, string>;
      delete resetStore[normalizedEmail];
      localStorage.setItem(RESET_REQUESTS_STORAGE_KEY, JSON.stringify(resetStore));
    }
  }

  return { success: true };
}

export async function logout(): Promise<void> {
  await delay(250);

  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  await delay(80);

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
  const user = await getCurrentUser();
  return user !== null;
}

export async function quickLogin(role: 'admin' | 'driver'): Promise<AuthResponse> {
  const user = mockUsers.find(u => u.role === role && u.active);

  if (!user) {
    return { success: false, error: 'No hay usuarios disponibles' };
  }

  await delay(350);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  return { success: true, user };
}
