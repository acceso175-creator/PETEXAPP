import { supabase } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types/domain';

export async function listUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from('profiles').select('*');

  if (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }

  return (data ?? []) as UserProfile[];
}

export async function getUser(id: string): Promise<UserProfile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();

  if (error) {
    throw new Error(`Error fetching user ${id}: ${error.message}`);
  }

  return data as UserProfile;
}
