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

const mapEvent = (row: unknown) => {
  const record: UnknownRecord = isRecord(row) ? row : {};
  const payloadValue = record.payload;
  return {
    id: getString(record, 'id'),
    shipmentId: getString(record, 'shipmentId', getString(record, 'shipment_id')),
    type: getString(record, 'type'),
    payload: isRecord(payloadValue) ? payloadValue : {},
    createdAt: getString(
      record,
      'createdAt',
      getString(record, 'created_at', new Date().toISOString())
    ),
  };
};

export async function GET(request: Request, context: any) {
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

  const { data, error } = await supabase
    .from('shipment_events')
    .select('*')
    .eq('shipment_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: `Error consultando timeline: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(mapEvent) });
}
