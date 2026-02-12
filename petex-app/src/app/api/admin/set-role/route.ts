import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

const isAllowedRole = (role: string): role is UserRole => ['admin', 'driver', 'ops'].includes(role);

type RpcRoleResponse = {
  id: string;
  role: UserRole;
};

const mapRpcErrorMessage = (message: string) => {
  if (message.includes('not authenticated')) return 'Token inválido o sesión expirada.';
  if (message.includes('only admins can change roles')) return 'Solo un admin puede cambiar roles.';
  if (message.includes('invalid role')) return 'Rol inválido. Usa admin, driver u ops.';
  if (message.includes('target user profile not found')) return 'Usuario objetivo no encontrado en perfiles.';
  return message;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Configuración de Supabase incompleta en el servidor' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 });
  }

  const body = (await request.json()) as { userId?: string; role?: string };
  if (!body.userId || !body.role || !isAllowedRole(body.role)) {
    return NextResponse.json({ error: 'Datos inválidos. userId y role son obligatorios' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.rpc('admin_set_user_role', {
    target_user_id: body.userId,
    new_role: body.role,
  });

  if (error) {
    const message = mapRpcErrorMessage(error.message);
    const status = message.includes('Solo un admin') ? 403 : message.includes('Token inválido') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  const updated = Array.isArray(data) ? (data[0] as RpcRoleResponse | undefined) : (data as RpcRoleResponse | null);

  return NextResponse.json({
    success: true,
    updatedUser: updated ?? { id: body.userId, role: body.role },
  });
}
