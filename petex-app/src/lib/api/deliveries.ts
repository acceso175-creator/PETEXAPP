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

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const getString = (row: UnknownRecord, key: string, fallback = ''): string => {
  const value = row[key];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return fallback;
};

const getNullableString = (row: UnknownRecord, key: string): string | null => {
  const value = row[key];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return null;
};

const getNumber = (row: UnknownRecord, key: string): number | null => {
  const value = row[key];
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

function mapDelivery(row: unknown): Delivery {
  const record: UnknownRecord = isRecord(row) ? row : {};
  const statusValue = getString(record, 'status', 'pendiente') as Delivery['status'];
  const lat = getNumber(record, 'lat') ?? getNumber(record, 'latitude');
  const lng = getNumber(record, 'lng') ?? getNumber(record, 'longitude');

  return {
    id: getString(record, 'id'),
    tracking: getString(record, 'tracking', getString(record, 'external_ref')),
    addressRaw: getString(record, 'addressRaw', getString(record, 'address')),
    addressNorm: getNullableString(record, 'addressNorm') ?? getNullableString(record, 'address_norm'),
    lat,
    lng,
    zoneId: getNullableString(record, 'zoneId') ?? getNullableString(record, 'zone_id'),
    status: statusValue,
    recipientName: getNullableString(record, 'recipientName') ?? getNullableString(record, 'recipient_name'),
    recipientPhone:
      getNullableString(record, 'recipientPhone') ??
      getNullableString(record, 'recipient_phone') ??
      getNullableString(record, 'phone'),
    createdAt: getNullableString(record, 'createdAt') ?? getNullableString(record, 'created_at') ?? undefined,
    updatedAt: getNullableString(record, 'updatedAt') ?? getNullableString(record, 'updated_at'),
    failedReason: getNullableString(record, 'failedReason') ?? getNullableString(record, 'failed_reason'),
    deliveredAt: getNullableString(record, 'deliveredAt') ?? getNullableString(record, 'delivered_at'),
  };
}

function mapDeliveryEvent(row: unknown): DeliveryEvent {
  const record: UnknownRecord = isRecord(row) ? row : {};
  const payloadValue = record.payload;

  return {
    id: getString(record, 'id'),
    deliveryId: getString(record, 'deliveryId', getString(record, 'delivery_id')),
    actorUserId: getNullableString(record, 'actorUserId') ?? getNullableString(record, 'actor_user_id'),
    type: getString(record, 'type'),
    payload: isRecord(payloadValue) ? payloadValue : {},
    createdAt: getString(record, 'createdAt', getString(record, 'created_at', new Date().toISOString())),
  };
}
