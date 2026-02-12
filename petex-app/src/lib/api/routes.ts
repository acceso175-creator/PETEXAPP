import { supabase } from '@/lib/supabase/client';
import type { Route, RouteStop } from '@/lib/types/domain';

export async function listRoutes(): Promise<Route[]> {
  const { data, error } = await supabase.from('routes').select('*');

  if (error) {
    throw new Error(`Error fetching routes: ${error.message}`);
  }

  return (data ?? []) as Route[];
}

export async function getRoute(id: string): Promise<Route> {
  const { data, error } = await supabase.from('routes').select('*').eq('id', id).single();

  if (error) {
    throw new Error(`Error fetching route ${id}: ${error.message}`);
  }

  return data as Route;
}

export async function listRouteStops(routeId: string): Promise<RouteStop[]> {
  const { data, error } = await supabase
    .from('route_stops')
    .select('*')
    .eq('routeId', routeId)
    .order('order', { ascending: true });

  if (error) {
    throw new Error(`Error fetching route stops for ${routeId}: ${error.message}`);
  }

  return (data ?? []) as RouteStop[];
}
