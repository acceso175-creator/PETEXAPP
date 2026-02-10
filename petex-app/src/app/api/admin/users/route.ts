import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getAccessTokenFromCookies = (cookieHeader: string | null) => {
  if (!cookieHeader) return null;

  const rawCookies = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return [part, ''] as const;
      return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))] as const;
    });

  const cookieMap = new Map(rawCookies);

  const directAuthCookie = [...cookieMap.entries()].find(([name]) =>
    name.startsWith('sb-') && name.endsWith('-auth-token')
  );

  if (directAuthCookie?.[1]) {
    try {
      const parsed = JSON.parse(directAuthCookie[1]);
      if (Array.isArray(parsed) && typeof parsed[0] === 'string' && parsed[0]) {
        return parsed[0];
      }
    } catch {
      // continue fallback
    }
  }

  const chunkedAuthCookies = [...cookieMap.entries()]
    .filter(([name]) => /sb-.*-auth-token\.\d+$/.test(name))
    .sort((a, b) => Number(a[0].split('.').pop()) - Number(b[0].split('.').pop()))
    .map(([, value]) => value)
    .join('');

  if (chunkedAuthCookies) {
    try {
      const parsed = JSON.parse(chunkedAuthCookies);
      if (Array.isArray(parsed) && typeof parsed[0] === 'string' && parsed[0]) {
        return parsed[0];
      }
    } catch {
      return null;
    }
  }

  return null;
};

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

  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = getAccessTokenFromCookies(request.headers.get('cookie'));
  const token = bearerToken || cookieToken;

  if (!token) {
    return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 401 });
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
