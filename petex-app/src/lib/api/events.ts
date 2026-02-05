import { getSupabaseClient } from '@/lib/supabase/client';
import type { Event } from '@/lib/types/domain';

export interface EventFilters {
  type?: string;
  userId?: string;
  routeId?: string;
  deliveryId?: string;
  from?: string;
  to?: string;
}

export async function listEvents(filters: EventFilters = {}): Promise<Event[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('events').select('*');

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.userId) {
    query = query.eq('userId', filters.userId);
  }

  if (filters.routeId) {
    query = query.eq('routeId', filters.routeId);
  }

  if (filters.deliveryId) {
    query = query.eq('deliveryId', filters.deliveryId);
  }

  if (filters.from) {
    query = query.gte('createdAt', filters.from);
  }

  if (filters.to) {
    query = query.lte('createdAt', filters.to);
  }

  const { data, error } = await query.order('createdAt', { ascending: false });

  if (error) {
    throw new Error(`Error fetching events: ${error.message}`);
  }

  return (data ?? []) as Event[];
}

export async function createEvent(payload: Omit<Event, 'id'>): Promise<Event> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('events').insert(payload).select('*').single();

  if (error) {
    throw new Error(`Error creating event: ${error.message}`);
  }

  return data as Event;
}
