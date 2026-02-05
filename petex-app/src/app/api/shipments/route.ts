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

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const city = searchParams.get('city');
  const search = searchParams.get('search');

  let query = supabase.from('shipments').select('*').order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (search) {
    const searchValue = `%${search}%`;
    query = query.or(
      `tracking.ilike.${searchValue},external_ref.ilike.${searchValue},address_raw.ilike.${searchValue},address_norm.ilike.${searchValue},recipient_name.ilike.${searchValue},city.ilike.${searchValue}`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: `Error consultando envíos: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(mapShipment) });
}
