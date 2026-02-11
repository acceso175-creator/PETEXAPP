import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import AdminUsersClient from './users-client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@/types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const getString = (row: UnknownRecord, key: string, fallback = '') =>
  typeof row[key] === 'string' ? row[key] : row[key] != null ? String(row[key]) : fallback;

const getOptionalString = (row: UnknownRecord, key: string) =>
  typeof row[key] === 'string' ? row[key] : undefined;

const getBoolean = (row: UnknownRecord, key: string, fallback = false) =>
  typeof row[key] === 'boolean' ? row[key] : fallback;

function mapProfileToUser(row: unknown): User {
  if (!isRecord(row)) {
    return {
      id: '',
      name: 'Usuario',
      role: 'driver',
      active: true,
    };
  }

  return {
    id: getString(row, 'id'),
    name:
      getString(row, 'full_name') ||
      getString(row, 'name') ||
      getString(row, 'email', 'Usuario'),
    role: (getString(row, 'role', 'driver') as User['role']),
    email: getOptionalString(row, 'email'),
    phone: getOptionalString(row, 'phone'),
    active: getBoolean(row, 'is_active', getBoolean(row, 'active', true)),
    avatarUrl: getOptionalString(row, 'avatar_url'),
  };
}

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="border-red-200 bg-red-50 p-4 text-red-700">
          Error al validar permisos: {profileError.message}
        </Card>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    redirect('/app');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, name, role, email, phone, is_active, active, avatar_url')
    .order('full_name', { ascending: true });

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="border-red-200 bg-red-50 p-4 text-red-700">
          Error al cargar perfiles: {error.message}
        </Card>
      </div>
    );
  }

  const users = (data ?? []).map(mapProfileToUser).filter((userItem: User) => userItem.id);

  return <AdminUsersClient initialUsers={users} />;
}
