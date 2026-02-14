import { getSupabaseClient } from '@/lib/supabase/client';
import type { Route, RouteStop } from '@/lib/types/domain';

export async function listRoutes(): Promise<Route[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('routes').select('*');

  if (error) {
    throw new Error(`Error fetching routes: ${error.message}`);
  }

  return (data ?? []) as Route[];
}

export async function listRoutesByDriverProfileId(driverProfileId: string): Promise<Route[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('driver_profile_id', driverProfileId)
    .order('route_date', { ascending: false });

  if (error) {
    throw new Error(`Error fetching routes for driver profile ${driverProfileId}: ${error.message}`);
  }

  return (data ?? []) as Route[];
}

export async function getRoute(id: string): Promise<Route> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('routes').select('*').eq('id', id).single();

  if (error) {
    throw new Error(`Error fetching route ${id}: ${error.message}`);
  }

  return data as Route;
}

export async function listRouteStops(routeId: string): Promise<RouteStop[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('route_stops')
    .select('*')
    .eq('route_id', routeId)
    .order('stop_order', { ascending: true });

  if (error) {
    throw new Error(`Error fetching route stops for ${routeId}: ${error.message}`);
  }

  return (data ?? []) as RouteStop[];
}
