/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

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

const mapShipment = (row: unknown) => {
  const record: UnknownRecord = isRecord(row) ? row : {};
  return {
    id: getString(record, 'id'),
    tracking: getString(record, 'tracking', getString(record, 'external_ref')),
    trackingCode: getNullableString(record, 'tracking_code'),
    status: getString(record, 'status', 'received'),
    city: getNullableString(record, 'city'),
    addressRaw: getNullableString(record, 'addressRaw') ?? getNullableString(record, 'address_raw'),
    addressNorm:
      getNullableString(record, 'addressNorm') ?? getNullableString(record, 'address_norm'),
    recipientName:
      getNullableString(record, 'recipientName') ?? getNullableString(record, 'recipient_name'),
    recipientPhone:
      getNullableString(record, 'recipientPhone') ?? getNullableString(record, 'recipient_phone'),
    createdAt: getNullableString(record, 'createdAt') ?? getNullableString(record, 'created_at'),
    updatedAt: getNullableString(record, 'updatedAt') ?? getNullableString(record, 'updated_at'),
  };
};

export async function POST(request: Request, context: any) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          'Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      },
      { status: 500 }
    );
  }

  const { id } = context.params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    actorUserId?: string;
    reason?: string;
  };

  if (!body.status) {
    return NextResponse.json(
      { error: 'Debe proporcionar un estado válido.' },
      { status: 400 }
    );
  }

  const { data: current, error: currentError } = await supabase
    .from('shipments')
    .select('status')
    .eq('id', id)
    .single();

  if (currentError) {
    return NextResponse.json(
      { error: `Error obteniendo envío: ${currentError.message}` },
      { status: 500 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from('shipments')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: `Error actualizando envío: ${updateError.message}` },
      { status: 500 }
    );
  }

  const payload = {
    from: (current as { status?: string | null }).status ?? null,
    to: body.status,
    ...(body.reason ? { reason: body.reason } : {}),
  };

  const { error: eventError } = await supabase.from('shipment_events').insert({
    shipment_id: id,
    actor_user_id: body.actorUserId ?? null,
    type: 'status_changed',
    payload,
  });

  if (eventError) {
    return NextResponse.json(
      { error: `Error registrando evento: ${eventError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: mapShipment(updated) });
}
