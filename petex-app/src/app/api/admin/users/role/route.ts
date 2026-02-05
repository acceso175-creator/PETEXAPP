import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

const isAllowedRole = (role: string): role is UserRole => ['admin', 'driver', 'ops'].includes(role);

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
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

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: requesterData, error: requesterError } = await authClient.auth.getUser(token);
  if (requesterError || !requesterData.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: requesterProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', requesterData.user.id)
    .single();

  if (profileError || !requesterProfile || requesterProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Solo un admin puede cambiar roles' }, { status: 403 });
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ role: body.role })
    .eq('id', body.userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
