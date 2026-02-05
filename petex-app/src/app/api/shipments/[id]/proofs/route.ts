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

const getNullableNumber = (row: UnknownRecord, key: string): number | null => {
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

const mapProof = (row: unknown) => {
  const record: UnknownRecord = isRecord(row) ? row : {};
  return {
    id: getString(record, 'id'),
    shipmentId: getString(record, 'shipmentId', getString(record, 'shipment_id')),
    photoUrl: getNullableString(record, 'photoUrl') ?? getNullableString(record, 'photo_url'),
    proofUrl: getNullableString(record, 'proofUrl') ?? getNullableString(record, 'proof_url'),
    signatureUrl:
      getNullableString(record, 'signatureUrl') ?? getNullableString(record, 'signature_url'),
    lat: getNullableNumber(record, 'lat') ?? getNullableNumber(record, 'latitude'),
    lng: getNullableNumber(record, 'lng') ?? getNullableNumber(record, 'longitude'),
    createdAt: getNullableString(record, 'createdAt') ?? getNullableString(record, 'created_at'),
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
    .from('delivery_proofs')
    .select('*')
    .eq('shipment_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: `Error consultando evidencia: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(mapProof) });
}
