import { redirect } from 'next/navigation';
import type { Route, RouteStatus, Stop } from '@/types';
import DriverRouteClient from './route-client';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const getString = (row: UnknownRecord, key: string, fallback = '') =>
  typeof row[key] === 'string' ? row[key] : row[key] != null ? String(row[key]) : fallback;

function isRouteStatus(raw: string): raw is RouteStatus {
  return raw === 'draft' || raw === 'active' || raw === 'done';
}

function parseRouteStatus(raw: string | null | undefined): RouteStatus {
  if (raw && isRouteStatus(raw)) {
    return raw;
  }
  return 'draft';
}

function parseNumber(raw: unknown, fallback = 0): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    const value = Number(raw);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return fallback;
}

function parseInteger(raw: unknown, fallback = 0): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.trunc(raw);
  }
  if (typeof raw === 'string') {
    const value = Number.parseInt(raw, 10);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return fallback;
}

function mapRoute(row: unknown): Route {
  if (!isRecord(row)) {
    return {
      id: '',
      name: 'Ruta',
      dateISO: new Date().toISOString().split('T')[0],
      zoneId: '',
      status: 'active',
      progressPct: 0,
      totalStops: 0,
      completedStops: 0,
      createdAt: new Date().toISOString(),
    };
  }

  const rawStatus = getString(row, 'status') || undefined;

  return {
    id: getString(row, 'id'),
    name: getString(row, 'name', 'Ruta'),
    dateISO:
      getString(row, 'date_iso') ||
      getString(row, 'dateISO') ||
      getString(row, 'date', new Date().toISOString().split('T')[0]),
    zoneId: getString(row, 'zone_id') || getString(row, 'zoneId'),
    driverId: getString(row, 'driver_id') || getString(row, 'driverId') || undefined,
    status: parseRouteStatus(rawStatus),
    progressPct: parseNumber(row.progress_pct ?? row.progressPct, 0),
    totalStops: parseInteger(row.total_stops ?? row.totalStops, 0),
    completedStops: parseInteger(row.completed_stops ?? row.completedStops, 0),
    createdAt: getString(row, 'created_at', new Date().toISOString()),
  };
}

function mapStop(row: unknown, routeId: string): Stop {
  if (!isRecord(row)) {
    return {
      id: '',
      routeId,
      packageId: '',
      order: 0,
      status: 'pending',
    };
  }

  const status = getString(row, 'status', 'pending');

  return {
    id: getString(row, 'id'),
    routeId: getString(row, 'route_id') || getString(row, 'routeId', routeId),
    packageId:
      getString(row, 'delivery_id') ||
      getString(row, 'package_id') ||
      getString(row, 'packageId'),
    order: parseInteger(row.order ?? row.stop_order, 0),
    status: status === 'delivered' || status === 'failed' ? status : 'pending',
    deliveredAt: getString(row, 'delivered_at') || undefined,
    failureReason: getString(row, 'failure_reason') || undefined,
    notes: getString(row, 'notes') || undefined,
  };
}

export default async function DriverRoutePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let errorMessage: string | null = null;
  let route: Route | null = null;
  let stops: Stop[] = [];

  const { data: routesData, error: routeError } = await supabase
    .from('routes')
    .select('*')
    .eq('driver_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  if (routeError) {
    errorMessage = `Error al cargar ruta: ${routeError.message}`;
  } else if (routesData && routesData.length > 0) {
    route = mapRoute(routesData[0]);
  }

  if (route && !errorMessage) {
    const { data: stopsData, error: stopsError } = await supabase
      .from('route_stops')
      .select('*')
      .eq('route_id', route.id)
      .order('order', { ascending: true });

    if (stopsError) {
      errorMessage = `Error al cargar paradas: ${stopsError.message}`;
    } else {
      stops = (stopsData ?? []).map((stopRow: unknown) => mapStop(stopRow, route!.id)).filter((stop: Stop) => stop.id);
    }
  }

  return (
    <DriverRouteClient
      initialRoute={route}
      initialStops={stops}
      errorMessage={errorMessage}
      actorUserId={user.id}
    />
  );
}
