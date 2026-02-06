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

const ROUTE_STATUS = ['assigned', 'in_progress', 'completed', 'cancelled'] as const;
type RouteStatus = typeof ROUTE_STATUS[number];

const STOP_STATUS = ['pending', 'in_progress', 'delivered', 'failed', 'cancelled'] as const;
type StopStatus = typeof STOP_STATUS[number];

type DriverRoute = {
  id: string;
  date: string;
  status: RouteStatus;
  notes: string | null;
};

type DriverStop = {
  id: string;
  stop_order: number;
  recipient_name: string | null;
  address: string | null;
  status: StopStatus;
};

function parseRouteStatus(v: unknown): RouteStatus {
  const s = String(v ?? '').trim().toLowerCase();
  return (ROUTE_STATUS as readonly string[]).includes(s) ? (s as RouteStatus) : 'assigned';
}

function parseStopStatus(v: unknown): StopStatus {
  const s = String(v ?? '').trim().toLowerCase();
  return (STOP_STATUS as readonly string[]).includes(s) ? (s as StopStatus) : 'pending';
}

const todayLocalIso = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

export default function DriverHomePage() {
  const { user } = useAuth();
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [stops, setStops] = useState<DriverStop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTodayRoute = async () => {
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
        const today = todayLocalIso();

        const { data: routeData, error: routeError } = await supabase
          .from('routes')
          .select('id,date,status,notes')
          .eq('driver_id', user.id)
          .eq('date', today)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (routeError) {
          throw routeError;
        }

        if (!routeData) {
          setRoute(null);
          setStops([]);
          return;
        }

        setRoute({
          id: String(routeData.id),
          date: String(routeData.date),
          notes: routeData.notes ? String(routeData.notes) : null,
          status: parseRouteStatus(routeData.status),
        });

        const { data: stopsData, error: stopsError } = await supabase
          .from('route_stops')
          .select('id,stop_order,recipient_name,address,status')
          .eq('route_id', routeData.id)
          .order('stop_order', { ascending: true });

        if (stopsError) {
          throw stopsError;
        }

        setStops(
          (stopsData ?? []).map((stop) => ({
            id: String(stop.id),
            stop_order: Number(stop.stop_order ?? 0),
            recipient_name: stop.recipient_name ? String(stop.recipient_name) : null,
            address: stop.address ? String(stop.address) : null,
            status: parseStopStatus(stop.status),
          }))
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar tu ruta de hoy');
      } finally {
        setIsLoading(false);
      }
    };

    loadTodayRoute();
  }, [user]);

  const completedStops = useMemo(
    () => stops.filter((stop) => stop.status === 'delivered').length,
    [stops]
  );

  if (isLoading) {
    return <LoadingScreen message="Cargando tu ruta de hoy..." />;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Mi ruta de hoy</h1>
        <p className="text-sm text-slate-500">Vista rápida de tus paradas asignadas.</p>
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
            Cuando logística te asigne una ruta para hoy, aparecerá aquí automáticamente.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Estado de ruta</p>
                <p className="text-xs text-slate-500">{route.date}</p>
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
              {stops.map((stop) => (
                <div key={stop.id} className="flex items-start justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">#{stop.stop_order} · {stop.recipient_name || 'Destinatario'}</p>
                    <p className="text-xs text-slate-500">{stop.address || 'Dirección pendiente'}</p>
                  </div>
                  <div className="ml-2 flex items-center gap-1 text-xs capitalize text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {stop.status}
                  </div>
                </div>
              ))}
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
