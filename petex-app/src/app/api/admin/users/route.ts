import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Configuración de Supabase incompleta en el servidor' },
      { status: 500 }
    );
  }

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Token Bearer requerido' }, { status: 401 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authUserData, error: authUserError } = await authClient.auth.getUser(token);
  if (authUserError || !authUserData.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: requesterProfile, error: requesterError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', authUserData.user.id)
    .single();

  if (requesterError || !requesterProfile || requesterProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso restringido a administradores' }, { status: 403 });
  }

  const { data: users, error: usersError } = await adminClient
    .from('profiles')
    .select('id,email,full_name,role')
    .order('created_at', { ascending: false });

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 400 });
  }

  return NextResponse.json({ users: users ?? [] });
}
