import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseConfigError = !supabaseUrl
  ? 'Falta configurar NEXT_PUBLIC_SUPABASE_URL.'
  : !supabaseAnonKey
    ? 'Falta configurar NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    : null;

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);

export const getSupabaseClient = () => {
  if (!supabase || supabaseConfigError) {
    throw new Error(
      supabaseConfigError ??
        'Supabase no está configurado. Verifica las variables de entorno.'
    );
  }
  return supabase;
};

export const getSupabaseRuntimeConfig = () => {
  const url = supabaseUrl || null;
  const projectRef = url
    ? (() => {
        try {
          return new URL(url).hostname.split('.')[0] ?? null;
        } catch {
          return null;
        }
      })()
    : null;

  return {
    url,
    projectRef,
    hasAnonKey: Boolean(supabaseAnonKey),
    configError: supabaseConfigError,
  };
};
