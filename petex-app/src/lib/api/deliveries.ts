import { supabase } from '@/lib/supabase/client';
import type { Delivery, DeliveryEvent, DeliveryStatus } from '@/lib/types/domain';

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

  return (data ?? []).map(mapDelivery) as Delivery[];
}

export async function getDelivery(id: string): Promise<Delivery> {
  const { data, error } = await supabase.from('deliveries').select('*').eq('id', id).single();

  if (error) {
    throw new Error(`Error fetching delivery ${id}: ${error.message}`);
  }

  return mapDelivery(data as Record<string, unknown>);
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

  return mapDelivery(data as Record<string, unknown>);
}

const validStatuses: DeliveryStatus[] = ['pendiente', 'entregado', 'fallido'];

export interface SetDeliveryStatusOptions {
  reason?: string;
  actorUserId?: string;
}

export async function setDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  opts: SetDeliveryStatusOptions = {}
): Promise<Delivery> {
  if (!validStatuses.includes(status)) {
    throw new Error(`Estado inválido: ${status}`);
  }

  if (status === 'fallido' && !opts.reason) {
    throw new Error('Debe proporcionar un motivo para marcar como fallido');
  }

  const { data: current, error: currentError } = await supabase
    .from('deliveries')
    .select('status')
    .eq('id', deliveryId)
    .single();

  if (currentError) {
    throw new Error(`Error obteniendo entrega ${deliveryId}: ${currentError.message}`);
  }

  const updates: Partial<Delivery> & {
    updated_at: string;
    failed_reason: string | null;
    delivered_at: string | null;
  } = {
    status,
    updated_at: new Date().toISOString(),
    failed_reason: status === 'fallido' ? opts.reason ?? null : null,
    delivered_at: status === 'entregado' ? new Date().toISOString() : null,
  };

  const { data: updated, error: updateError } = await supabase
    .from('deliveries')
    .update(updates)
    .eq('id', deliveryId)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Error actualizando entrega ${deliveryId}: ${updateError.message}`);
  }

  const payload = {
    from: (current as { status?: string | null }).status ?? null,
    to: status,
    ...(opts.reason ? { reason: opts.reason } : {}),
  };

  const { error: eventError } = await supabase.from('delivery_events').insert({
    delivery_id: deliveryId,
    actor_user_id: opts.actorUserId ?? null,
    type: 'status_changed',
    payload,
  });

  if (eventError) {
    throw new Error(`Error registrando evento de entrega: ${eventError.message}`);
  }

  return mapDelivery(updated as Record<string, unknown>);
}

export async function listDeliveryEvents(deliveryId: string): Promise<DeliveryEvent[]> {
  const { data, error } = await supabase
    .from('delivery_events')
    .select('*')
    .eq('delivery_id', deliveryId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Error obteniendo eventos de entrega: ${error.message}`);
  }

  return (data ?? []).map(mapDeliveryEvent) as DeliveryEvent[];
}

function mapDelivery(data: Record<string, unknown>): Delivery {
  const record = data as Delivery & {
    failed_reason?: string | null;
    delivered_at?: string | null;
    updated_at?: string | null;
  };

  return {
    ...record,
    failedReason: record.failedReason ?? record.failed_reason ?? null,
    deliveredAt: record.deliveredAt ?? record.delivered_at ?? null,
    updatedAt: record.updatedAt ?? record.updated_at ?? null,
  };
}

function mapDeliveryEvent(data: Record<string, unknown>): DeliveryEvent {
  const record = data as DeliveryEvent & {
    delivery_id?: string;
    actor_user_id?: string | null;
    created_at?: string;
  };

  return {
    ...record,
    deliveryId: record.deliveryId ?? record.delivery_id ?? '',
    actorUserId: record.actorUserId ?? record.actor_user_id ?? null,
    createdAt: record.createdAt ?? record.created_at ?? new Date().toISOString(),
  };
}
