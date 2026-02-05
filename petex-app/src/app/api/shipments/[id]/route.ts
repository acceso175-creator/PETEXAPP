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

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: Request, context: RouteContext) {
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

  const { data, error } = await supabase.from('shipments').select('*').eq('id', id).single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Envío no encontrado.' },
      { status: error?.code === 'PGRST116' ? 404 : 500 }
    );
  }

  return NextResponse.json({ data: mapShipment(data) });
}
