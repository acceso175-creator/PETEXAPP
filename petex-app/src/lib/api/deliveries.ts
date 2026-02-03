import { supabase } from '@/lib/supabase/client';
import type { Delivery, DeliveryStatus } from '@/lib/types/domain';

export interface DeliveryFilters {
  status?: DeliveryStatus;
  zoneId?: string;
  search?: string;
}

export async function listDeliveries(filters: DeliveryFilters = {}): Promise<Delivery[]> {
  let query = supabase.from('deliveries').select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.zoneId) {
    query = query.eq('zoneId', filters.zoneId);
  }

  if (filters.search) {
    const searchValue = `%${filters.search}%`;
    query = query.or(
      `tracking.ilike.${searchValue},addressRaw.ilike.${searchValue},recipientName.ilike.${searchValue}`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching deliveries: ${error.message}`);
  }

  return (data ?? []) as Delivery[];
}

export async function getDelivery(id: string): Promise<Delivery> {
  const { data, error } = await supabase.from('deliveries').select('*').eq('id', id).single();

  if (error) {
    throw new Error(`Error fetching delivery ${id}: ${error.message}`);
  }

  return data as Delivery;
}

export async function updateDeliveryStatus(
  id: string,
  status: DeliveryStatus,
  payload: Partial<Delivery> = {}
): Promise<Delivery> {
  const { data, error } = await supabase
    .from('deliveries')
    .update({ ...payload, status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Error updating delivery ${id}: ${error.message}`);
  }

  return data as Delivery;
}
