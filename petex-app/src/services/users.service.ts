import { getSupabaseClient } from '@/lib/supabase/client';
import { mockUsers } from '@/lib/mock-data';
import type { User } from '@/types';

const mapUser = (row: Record<string, unknown>): User => ({
  id: String(row.id ?? ''),
  name: String(row.full_name ?? row.name ?? 'Sin nombre'),
  role: (String(row.role ?? 'driver') as User['role']),
  phone: (row.phone as string | undefined) ?? undefined,
  email: (row.email as string | undefined) ?? undefined,
  active: typeof row.active === 'boolean' ? row.active : true,
  avatarUrl: (row.avatar_url as string | undefined) ?? undefined,
});

const fallbackUsers = () => {
  console.warn('[users.service] fallback explícito a mockUsers (sin conexión o tabla no disponible).');
  return [...mockUsers];
};

export async function getUsers(filters?: { role?: string; active?: boolean }): Promise<User[]> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('profiles').select('*');
    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.active !== undefined) query = query.eq('active', filters.active);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => mapUser(row as Record<string, unknown>));
  } catch {
    let result = fallbackUsers();
    if (filters?.role) result = result.filter((user) => user.role === filters.role);
    if (filters?.active !== undefined) result = result.filter((user) => user.active === filters.active);
    return result;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return mapUser(data as Record<string, unknown>);
  } catch {
    return fallbackUsers().find((user) => user.id === id) ?? null;
  }
}

export async function getDrivers(activeOnly = true): Promise<User[]> {
  const users = await getUsers({ role: 'driver' });
  return activeOnly ? users.filter((user) => user.active) : users;
}

export async function createUser(_data: Partial<User>): Promise<User> {
  throw new Error('Alta de usuarios no soportada desde cliente. Usa Auth Admin API en backend.');
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  const supabase = getSupabaseClient();
  const payload = {
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.name !== undefined ? { full_name: data.name } : {}),
    ...(data.phone !== undefined ? { phone: data.phone } : {}),
    ...(data.active !== undefined ? { active: data.active } : {}),
    ...(data.avatarUrl !== undefined ? { avatar_url: data.avatarUrl } : {}),
  };

  const { data: updated, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`No se pudo actualizar el usuario: ${error.message}`);
  return updated ? mapUser(updated as Record<string, unknown>) : null;
}

export async function toggleUserActive(id: string): Promise<User | null> {
  const user = await getUserById(id);
  if (!user) return null;
  return updateUser(id, { active: !user.active });
}
