import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type InputRow = {
  order_id?: string;
  customer_name?: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  postal_code?: string;
  zone_hint?: string;
  carrier?: string;
  notes?: string;
  zone_id?: string | null;
  raw_row?: Record<string, unknown>;
};

type RequestBody = {
  rows?: InputRow[];
  useSingleDriver?: boolean;
  singleDriverId?: string;
  driverByGroup?: Record<string, string>;
  routeDate?: string;
};

type ZoneRow = { id: string; name: string; keywords: string[] | null };

const CHUNK_SIZE = 150;

const inferCarrierFromTracking = (trackingCode: string) => {
  const code = trackingCode.trim().toUpperCase();
  if (code.startsWith('ML-')) return 'MercadoLibre';
  if (code.startsWith('SHE-')) return 'SHEIN';
  if (code.startsWith('JT-')) return 'J&T';
  return 'PETEX';
};

const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

const normalize = (v: unknown) => String(v ?? '').trim();

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Configuración de Supabase incompleta en servidor.' }, { status: 500 });
  }

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Token Bearer requerido.' }, { status: 401 });

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rollbackRoute = async (routeId: string, reason: string) => {
    const { error } = await adminClient.from('routes').delete().eq('id', routeId);
    if (error) {
      console.error('[bulk-routes] No se pudo revertir route', { routeId, reason, error: error.message });
    }
  };

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }

  const body = (await request.json()) as RequestBody;
  const rows = body.rows ?? [];
  const useSingleDriver = Boolean(body.useSingleDriver);
  const singleDriverId = normalize(body.singleDriverId);
  const driverByGroup = body.driverByGroup ?? {};
  const routeDate = normalize(body.routeDate) || new Date().toISOString().slice(0, 10);

  if (!rows.length) {
    return NextResponse.json({ error: 'No se recibieron filas para procesar.' }, { status: 400 });
  }

  const { data: zonesData } = await adminClient.from('zones').select('id,name,keywords');
  const zones: ZoneRow[] = (zonesData ?? []).map((z) => ({
    id: String(z.id),
    name: String(z.name ?? ''),
    keywords: Array.isArray(z.keywords) ? z.keywords.map((x: unknown) => String(x).toLowerCase()) : null,
  }));

  const invalidRows: Array<{ row_number: number; reason: string }> = [];

  const normalized = rows
    .map((row, idx) => {
      const orderId = normalize(row.order_id);
      const address = normalize(row.address_line1);
      const customerName = normalize(row.customer_name);
      const phone = normalize(row.phone);
      const zoneHint = normalize(row.zone_hint);

      if (!orderId || !address || (!phone && !customerName)) {
        invalidRows.push({
          row_number: idx + 1,
          reason: 'Requiere order_id + address_line1 + (phone o customer_name).',
        });
        return null;
      }

      const search = `${address} ${normalize(row.city)} ${normalize(row.postal_code)} ${zoneHint}`.toLowerCase();
      const matchedZone = zones.find((zone) => {
        const byKeyword = (zone.keywords ?? []).some((kw) => search.includes(kw));
        const byName = zoneHint ? zone.name.toLowerCase().includes(zoneHint.toLowerCase()) : false;
        return byKeyword || byName;
      });

      return {
        order_id: orderId,
        customer_name: customerName,
        phone,
        address_line1: address,
        city: normalize(row.city),
        postal_code: normalize(row.postal_code),
        zone_hint: zoneHint,
        carrier: normalize(row.carrier),
        notes: normalize(row.notes),
        zone_id: row.zone_id ?? matchedZone?.id ?? null,
        raw_row: row.raw_row && typeof row.raw_row === 'object' ? row.raw_row : row,
      };
    })
    .filter(Boolean) as Array<{
    order_id: string;
    customer_name: string;
    phone: string;
    address_line1: string;
    city: string;
    postal_code: string;
    zone_hint: string;
    carrier: string;
    notes: string;
    zone_id: string | null;
    raw_row: Record<string, unknown>;
  }>;

  if (!normalized.length) {
    return NextResponse.json(
      {
        summary: { routes_created: 0, deliveries_imported: 0, invalid_rows: invalidRows.length },
        groups: [],
        invalid_rows: invalidRows,
      },
      { status: 200 }
    );
  }

  const grouped = new Map<string, typeof normalized>();
  if (useSingleDriver) {
    grouped.set('global', normalized);
  } else {
    normalized.forEach((row) => {
      const key = row.zone_id ?? (row.zone_hint.toLowerCase() || 'sin-zona');
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    });
  }

  const groupsSummary: Array<{ group: string; driver: string; shipments: number; routes: number }> = [];
  let routesCreated = 0;
  let deliveriesImported = 0;

  for (const [groupKey, groupRows] of grouped.entries()) {
    const driverId = useSingleDriver ? singleDriverId : normalize(driverByGroup[groupKey]);
    if (!driverId) {
      invalidRows.push({ row_number: 0, reason: `Falta driver para grupo ${groupKey}.` });
      continue;
    }

    const rowChunks = chunk(groupRows, CHUNK_SIZE);
    let createdRoutesInGroup = 0;

    for (const rowChunk of rowChunks) {
      const { data: routeData, error: routeError } = await adminClient
        .from('routes')
        .insert({
          route_date: routeDate,
          zone_id: useSingleDriver ? null : rowChunk[0]?.zone_id ?? null,
          driver_profile_id: driverId,
          status: 'active',
        })
        .select('id')
        .single();

      if (routeError || !routeData) {
        return NextResponse.json({ error: routeError?.message ?? 'Error creando route.' }, { status: 400 });
      }

      const { data: deliveryRows, error: deliveriesError } = await adminClient
        .from('deliveries')
        .upsert(
          rowChunk.map((row) => ({
            tracking_code: row.order_id,
            recipient_name: row.customer_name || null,
            phone: row.phone || null,
            address_text: row.address_line1,
            zone_id: row.zone_id,
            status: 'created',
            meta: {
              carrier: row.carrier || inferCarrierFromTracking(row.order_id),
              city: row.city,
              neighborhood: row.zone_hint,
              postal_code: row.postal_code,
              notes: row.notes,
              raw_row: row.raw_row,
              imported_by: 'admin_bulk_routes',
            },
          })),
          { onConflict: 'tracking_code' }
        )
        .select('id,tracking_code,recipient_name,phone,address_text');

      if (deliveriesError) {
        await rollbackRoute(routeData.id, 'deliveries_upsert_failed');
        return NextResponse.json({ error: deliveriesError.message }, { status: 400 });
      }

      const deliveryByTracking = new Map<
        string,
        { id: string; recipient_name: string | null; phone: string | null; address_text: string | null }
      >();
      (deliveryRows ?? []).forEach((d) => {
        const trackingCode = String(d.tracking_code ?? '');
        if (!trackingCode) return;
        deliveryByTracking.set(trackingCode, {
          id: String(d.id),
          recipient_name: d.recipient_name ? String(d.recipient_name) : null,
          phone: d.phone ? String(d.phone) : null,
          address_text: d.address_text ? String(d.address_text) : null,
        });
      });

      const validStops: Array<{
        route_id: string;
        delivery_id: string;
        stop_order: number;
        title: string;
        address_text: string;
        phone: string | null;
        meta: Record<string, unknown>;
      }> = [];

      rowChunk.forEach((row, index) => {
        const delivery = deliveryByTracking.get(row.order_id);
        if (!delivery?.id) {
          invalidRows.push({
            row_number: 0,
            reason: `No se encontró delivery_id para tracking_code ${row.order_id}.`,
          });
          return;
        }

        validStops.push({
          route_id: routeData.id,
          delivery_id: delivery.id,
          stop_order: index + 1,
          title: delivery.recipient_name || row.order_id || 'Parada',
          address_text: delivery.address_text || row.address_line1,
          phone: delivery.phone || row.phone || null,
          meta: {
            order_id: row.order_id,
            customer_name: row.customer_name,
            phone: row.phone,
            zone_hint: row.zone_hint,
          },
        });
      });

      if (!validStops.length) {
        await rollbackRoute(routeData.id, 'chunk_without_valid_stops');
        invalidRows.push({ row_number: 0, reason: 'Chunk sin paradas válidas; ruta revertida.' });
        continue;
      }

      const { error: stopsError } = await adminClient.from('route_stops').insert(validStops);
      if (stopsError) {
        await rollbackRoute(routeData.id, 'route_stops_insert_failed');
        return NextResponse.json({ error: stopsError.message }, { status: 400 });
      }

      createdRoutesInGroup += 1;
      routesCreated += 1;
      deliveriesImported += validStops.length;
    }

    groupsSummary.push({
      group: groupKey,
      driver: driverId,
      shipments: groupRows.length,
      routes: createdRoutesInGroup,
    });
  }

  return NextResponse.json({
    summary: {
      routes_created: routesCreated,
      deliveries_imported: deliveriesImported,
      invalid_rows: invalidRows.length,
    },
    groups: groupsSummary,
    invalid_rows: invalidRows,
  });
}
