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

  return mapDelivery(data);
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

  return mapDelivery(data);
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

  return mapDelivery(updated);
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

function mapDelivery(row: any): Delivery {
  const status = (row?.status ?? 'pendiente') as Delivery['status'];
  const lat = row?.lat ?? row?.latitude ?? null;
  const lng = row?.lng ?? row?.longitude ?? null;

  return {
    id: String(row?.id ?? ''),
    tracking: String(row?.tracking ?? row?.external_ref ?? ''),
    addressRaw: String(row?.addressRaw ?? row?.address ?? ''),
    addressNorm: row?.addressNorm ?? row?.address_norm ?? null,
    lat: typeof lat === 'number' ? lat : lat ? Number(lat) : null,
    lng: typeof lng === 'number' ? lng : lng ? Number(lng) : null,
    zoneId: row?.zoneId ?? row?.zone_id ?? null,
    status,
    recipientName: row?.recipientName ?? row?.recipient_name ?? null,
    recipientPhone: row?.recipientPhone ?? row?.recipient_phone ?? row?.phone ?? null,
    createdAt: row?.createdAt ?? row?.created_at ?? undefined,
    updatedAt: row?.updatedAt ?? row?.updated_at ?? null,
    failedReason: row?.failedReason ?? row?.failed_reason ?? null,
    deliveredAt: row?.deliveredAt ?? row?.delivered_at ?? null,
  };
}

function mapDeliveryEvent(row: any): DeliveryEvent {
  return {
    id: String(row?.id ?? ''),
    deliveryId: String(row?.deliveryId ?? row?.delivery_id ?? ''),
    actorUserId: row?.actorUserId ?? row?.actor_user_id ?? null,
    type: String(row?.type ?? ''),
    payload: (row?.payload ?? {}) as Record<string, unknown>,
    createdAt: String(row?.createdAt ?? row?.created_at ?? new Date().toISOString()),
  };
}
