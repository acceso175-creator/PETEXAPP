import { supabase } from '@/lib/supabase/client';
import type { Zone } from '@/lib/types/domain';

export async function listZones(): Promise<Zone[]> {
  const { data, error } = await supabase.from('zones').select('*').order('name');

  if (error) {
    throw new Error(`Error fetching zones: ${error.message}`);
  }

  return (data ?? []) as Zone[];
}
