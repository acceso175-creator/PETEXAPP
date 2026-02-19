'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getSupabaseClient, supabaseConfigError } from '@/lib/supabase/client';
import { useAuth } from '@/state';
import { Route as RouteIcon, MapPin, ChevronRight } from 'lucide-react';

const ROUTE_STATUS = ['assigned', 'active', 'in_progress', 'completed', 'cancelled'] as const;
type RouteStatus = typeof ROUTE_STATUS[number];

type DriverRoute = {
  id: string;
  route_date: string;
  status: RouteStatus;
};


type CurrentRouteRow = {
  id: string;
  route_date: string;
  status: string;
};

type DriverStop = {
  id: string;
  stop_order: number;
  title: string | null;
  customer_name: string | null;
  address_text: string | null;
  completed_at: string | null;
};

function parseRouteStatus(v: unknown): RouteStatus {
  const s = String(v ?? '').trim().toLowerCase();
  return (ROUTE_STATUS as readonly string[]).includes(s) ? (s as RouteStatus) : 'assigned';
}

export default function DriverHomePage() {
  const { user } = useAuth();
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [stops, setStops] = useState<DriverStop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentRoute = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);

      if (supabaseConfigError) {
        setIsLoading(false);
        setError('Supabase no está configurado en este entorno.');
        return;
      }

      try {
        const supabase = getSupabaseClient();

        const { data: routeData, error: routeError } = await supabase
          .rpc('get_driver_current_route')
          .maybeSingle();

        if (routeError) throw routeError;

        const currentRoute = routeData as CurrentRouteRow | null;

        if (!currentRoute) {
          setRoute(null);
          setStops([]);
          return;
        }

        setRoute({
          id: String(currentRoute.id),
          route_date: String(currentRoute.route_date),
          status: parseRouteStatus(currentRoute.status),
        });

        const { data: stopsData, error: stopsError } = await supabase
          .from('route_stops')
          .select('id,stop_order,title,address_text,meta,completed_at')
          .eq('route_id', currentRoute.id)
          .order('stop_order', { ascending: true });

        if (stopsError) throw stopsError;

        setStops(
          (stopsData ?? []).map((stop) => ({
            id: String(stop.id),
            stop_order: Number(stop.stop_order ?? 0),
            title: stop.title ? String(stop.title) : null,
            customer_name:
              stop.meta && typeof stop.meta === 'object' && 'customer_name' in stop.meta && stop.meta.customer_name
                ? String(stop.meta.customer_name)
                : null,
            address_text: stop.address_text ? String(stop.address_text) : null,
            completed_at: stop.completed_at ? String(stop.completed_at) : null,
          }))
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar tu ruta actual');
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentRoute();
  }, [user]);

  const completedStops = useMemo(
    () => stops.filter((stop) => Boolean(stop.completed_at)).length,
    [stops]
  );

  if (isLoading) {
    return <LoadingScreen message="Cargando tu ruta actual..." />;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Mi ruta</h1>
        <p className="text-sm text-slate-500">Vista rápida de tus paradas activas.</p>
      </div>

      {error ? (
        <Card className="p-4 text-sm text-red-600">{error}</Card>
      ) : null}

      {!route ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <RouteIcon className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Aún no tienes ruta asignada</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cuando logística te asigne una ruta activa, aparecerá aquí automáticamente.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Estado de ruta</p>
                <p className="text-xs text-slate-500">{route.route_date}</p>
              </div>
              <Badge variant="secondary" className="capitalize">{route.status}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {completedStops} de {stops.length} paradas completadas.
            </p>
            <Link href={`/app/route/${route.id}`}>
              <Button variant="outline" className="mt-4 w-full">
                Ver detalles
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Paradas</h3>
            <div className="space-y-2">
              {stops.map((stop) => {
                const address = stop.address_text ?? '';
                const stopState = stop.completed_at ? 'Completada' : 'Pendiente';
                return (
                  <div key={stop.id} className="flex items-start justify-between rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">#{stop.stop_order} · {stop.title || stop.customer_name || address || 'Parada'}</p>
                      <p className="text-xs text-slate-500">{address || 'Dirección pendiente'}</p>
                    </div>
                    <div className="ml-2 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {stopState}
                    </div>
                  </div>
                );
              })}
              {!stops.length ? (
                <p className="text-sm text-slate-500">Esta ruta aún no tiene paradas cargadas.</p>
              ) : null}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
