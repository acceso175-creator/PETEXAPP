// Users Service - Mock Implementation
// TODO: Replace with Supabase queries

import type { User } from '@/types';
import { mockUsers } from '@/lib/mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const users = [...mockUsers];

export async function getUsers(filters?: {
  role?: string;
  active?: boolean;
}): Promise<User[]> {
  // TODO: Replace with Supabase query
  await delay(300);

  let result = [...users];

  if (filters?.role) {
    result = result.filter(u => u.role === filters.role);
  }

  if (filters?.active !== undefined) {
    result = result.filter(u => u.active === filters.active);
  }

  return result;
}

export async function getUserById(id: string): Promise<User | null> {
  // TODO: Replace with Supabase query
  await delay(200);
  return users.find(u => u.id === id) || null;
}

export async function getDrivers(activeOnly = true): Promise<User[]> {
  // TODO: Replace with Supabase query
  await delay(200);
  return users.filter(u => u.role === 'driver' && (!activeOnly || u.active));
}

export async function createUser(data: Partial<User>): Promise<User> {
  // TODO: Replace with Supabase insert + Auth
  await delay(400);

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: data.name || 'Nuevo Usuario',
    role: data.role || 'driver',
    email: data.email,
    phone: data.phone,
    active: true,
  };

  users.push(newUser);
  return newUser;
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  // TODO: Replace with Supabase update
  await delay(300);

  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  users[index] = { ...users[index], ...data };
  return users[index];
}

export async function toggleUserActive(id: string): Promise<User | null> {
  // TODO: Replace with Supabase update
  const user = users.find(u => u.id === id);
  if (!user) return null;

  return updateUser(id, { active: !user.active });
}
