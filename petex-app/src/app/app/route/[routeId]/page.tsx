'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getSupabaseClient, supabaseConfigError } from '@/lib/supabase/client';
import { useAuth } from '@/state';

const STOP_STATUS = ['pending', 'in_progress', 'delivered', 'completed', 'failed', 'cancelled'] as const;
type StopStatus = typeof STOP_STATUS[number];

type StopDetail = {
  id: string;
  route_id: string;
  stop_order: number;
  position: number;
  title: string | null;
  recipient_name: string | null;
  address_text: string | null;
  phone: string | null;
  status: StopStatus;
  delivery_id: string | null;
  tracking_code: string | null;
  completed_at: string | null;
};

type DriverRoute = {
  id: string;
  status: string;
};

type QueryError = {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
  status?: number;
};

type DeliveryLookup = {
  id: string;
  recipient_name: string | null;
  phone: string | null;
  address_text: string | null;
  tracking_code: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const asText = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return null;
};

function parseStopStatus(v: unknown): StopStatus {
  const s = String(v ?? '').trim().toLowerCase();
  return (STOP_STATUS as readonly string[]).includes(s) ? (s as StopStatus) : 'pending';
}

function formatSupabaseError(error: QueryError, fallbackStatus = 400): string {
  const code = error.code ?? 'unknown';
  const status = error.status ?? fallbackStatus;
  const details = error.details ? ` · ${error.details}` : '';
  const hint = error.hint ? ` · hint: ${error.hint}` : '';
  return `(${status}/${code}) ${error.message}${details}${hint}`;
}

export default function DriverRouteDetailPage() {
  const params = useParams<{ routeId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const routeId = params?.routeId;

  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [stops, setStops] = useState<StopDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStop, setActiveStop] = useState<StopDetail | null>(null);
  const [isCompletingStop, setIsCompletingStop] = useState(false);

  const completedStops = useMemo(
    () => stops.filter((stop) => stop.status === 'completed' || stop.status === 'delivered').length,
    [stops]
  );

  const loadRoute = useCallback(async () => {
    if (!routeId || !user) return;
    setIsLoading(true);
    setError(null);

    if (supabaseConfigError) {
      setError('Supabase no está configurado.');
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();

    const { data: routeData, error: routeError } = await supabase
      .from('routes')
      .select('id,status')
      .eq('id', routeId)
      .eq('driver_profile_id', user.id)
      .maybeSingle();

    if (routeError) {
      const msg = `No se pudo validar la ruta ${formatSupabaseError(routeError as QueryError)}`;
      setError(msg);
      setIsLoading(false);
      return;
    }

    if (!routeData) {
      const { data: routeById, error: routeByIdError } = await supabase
        .from('routes')
        .select('id')
        .eq('id', routeId)
        .maybeSingle();

      if (routeByIdError) {
        const msg = `No se pudo consultar la ruta ${formatSupabaseError(routeByIdError as QueryError)}`;
        setError(msg);
      } else if (routeById?.id) {
        setError(
          'No tienes permiso para ver esta ruta (403). Verifica policies RLS de routes/route_stops para driver_profile_id.'
        );
      } else {
        setError('La ruta no existe o no tienes acceso (404/403). Revisa asignación y policies RLS.');
      }

      setIsLoading(false);
      return;
    }

    setRoute({ id: String(routeData.id), status: String(routeData.status ?? 'active') });

    const stopsQuery = supabase
      .from('route_stops')
      .select('*')
      .eq('route_id', routeId)
      .order('position', { ascending: true })
      .order('stop_order', { ascending: true });

    const { data: stopsRows, error: stopsError } = await stopsQuery;

    if (stopsError) {
      const msg = `No se pudo cargar paradas ${formatSupabaseError(stopsError as QueryError)}`;
      setError(msg);
      console.error('[driver-route-detail] Posible bloqueo RLS en route_stops.', {
        routeId,
        userId: user.id,
        error: stopsError,
      });
      // Si este error aparece en producción, revisar policies SELECT para drivers en route_stops/deliveries
      // permitiendo acceso cuando routes.driver_profile_id = auth.uid().
      setIsLoading(false);
      return;
    }

    const routeStops = (stopsRows ?? []).map((row): StopDetail => {
      const record = isRecord(row) ? row : {};
      const meta = isRecord(record.meta) ? record.meta : {};
      const rawPosition = Number(record.position ?? record.stop_order ?? 0);
      const rawOrder = Number(record.stop_order ?? record.position ?? 0);
      const title = asText(record.title);
      const recipientFromMeta = asText(meta.customer_name) ?? asText(meta.recipient_name);

      return {
        id: String(record.id ?? ''),
        route_id: String(record.route_id ?? routeId),
        stop_order: Number.isFinite(rawOrder) ? rawOrder : 0,
        position: Number.isFinite(rawPosition) ? rawPosition : 0,
        title,
        recipient_name: asText(record.recipient_name) ?? recipientFromMeta,
        address_text: asText(record.address_text),
        phone: asText(record.phone),
        status: parseStopStatus(record.status),
        delivery_id: asText(record.delivery_id),
        tracking_code: asText(record.tracking_code) ?? asText(meta.order_id),
        completed_at: asText(record.completed_at),
      };
    });

    const deliveryIds = routeStops
      .map((stop) => stop.delivery_id)
      .filter((value): value is string => Boolean(value));

    const trackingCodes = routeStops
      .map((stop) => stop.tracking_code)
      .filter((value): value is string => Boolean(value));

    const deliveryById = new Map<string, DeliveryLookup>();
    const deliveryByTracking = new Map<string, DeliveryLookup>();

    if (deliveryIds.length || trackingCodes.length) {
      let deliveriesQuery = supabase
        .from('deliveries')
        .select('id,tracking_code,recipient_name,phone,address_text');

      const filters: string[] = [];
      if (deliveryIds.length) {
        filters.push(`id.in.(${deliveryIds.join(',')})`);
      }
      if (trackingCodes.length) {
        const escaped = trackingCodes.map((code) => `"${code.replace(/\"/g, '\\"')}"`);
        filters.push(`tracking_code.in.(${escaped.join(',')})`);
      }
      if (filters.length) {
        deliveriesQuery = deliveriesQuery.or(filters.join(','));
      }

      const { data: deliveriesRows, error: deliveriesError } = await deliveriesQuery;
      if (deliveriesError) {
        setError(`No se pudo cargar datos de entrega ${formatSupabaseError(deliveriesError as QueryError)}`);
        console.error('[driver-route-detail] Posible bloqueo RLS en deliveries.', {
          routeId,
          userId: user.id,
          error: deliveriesError,
        });
        setIsLoading(false);
        return;
      }

      (deliveriesRows ?? []).forEach((row) => {
        const delivery: DeliveryLookup = {
          id: String(row.id),
          recipient_name: row.recipient_name ? String(row.recipient_name) : null,
          phone: row.phone ? String(row.phone) : null,
          address_text: row.address_text ? String(row.address_text) : null,
          tracking_code: row.tracking_code ? String(row.tracking_code) : null,
        };
        deliveryById.set(delivery.id, delivery);
        if (delivery.tracking_code) {
          deliveryByTracking.set(delivery.tracking_code, delivery);
        }
      });
    }

    const hydratedStops = routeStops
      .map((stop) => {
        const delivery = (stop.delivery_id ? deliveryById.get(stop.delivery_id) : null) ||
          (stop.tracking_code ? deliveryByTracking.get(stop.tracking_code) : null);
        return {
          ...stop,
          recipient_name: stop.recipient_name ?? delivery?.recipient_name ?? null,
          phone: stop.phone ?? delivery?.phone ?? null,
          address_text: stop.address_text ?? delivery?.address_text ?? null,
          tracking_code: stop.tracking_code ?? delivery?.tracking_code ?? null,
        };
      })
      .sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return a.stop_order - b.stop_order;
      });

    setStops(hydratedStops);
    setIsLoading(false);
  }, [routeId, user]);

  useEffect(() => {
    void loadRoute();
  }, [loadRoute]);

  const handleCompleteStop = async () => {
    if (!activeStop || !user) return;
    const stopId = activeStop.id;
    const nowIso = new Date().toISOString();

    setIsCompletingStop(true);

    const previousStops = stops;
    const optimisticStops = stops.map((stop) =>
      stop.id === stopId ? { ...stop, status: 'completed' as const, completed_at: nowIso } : stop
    );
    setStops(optimisticStops);

    try {
      const supabase = getSupabaseClient();

      const { data: ownershipStop, error: ownershipError } = await supabase
        .from('route_stops')
        .select('id,route_id')
        .eq('id', stopId)
        .eq('route_id', routeId)
        .maybeSingle();

      if (ownershipError) {
        throw new Error(`No se pudo validar ownership ${formatSupabaseError(ownershipError as QueryError)}`);
      }

      if (!ownershipStop?.id) {
        throw new Error('No se pudo validar ownership del stop (403). Revisa policies RLS para drivers.');
      }

      const updatePayload: { status: string; completed_at?: string } = {
        status: 'completed',
        completed_at: nowIso,
      };

      let { error: stopUpdateError } = await supabase.from('route_stops').update(updatePayload).eq('id', stopId);

      if ((stopUpdateError as QueryError | null)?.code === '42703') {
        const fallback = await supabase.from('route_stops').update({ status: 'completed' }).eq('id', stopId);
        stopUpdateError = fallback.error;
      }

      if (stopUpdateError) {
        throw new Error(`No se pudo completar parada ${formatSupabaseError(stopUpdateError as QueryError)}`);
      }

      const completedStopsCount = optimisticStops.filter(
        (stop) => stop.status === 'completed' || stop.status === 'delivered'
      ).length;

      if (completedStopsCount === optimisticStops.length && optimisticStops.length > 0) {
        const { error: routeUpdateError } = await supabase
          .from('routes')
          .update({ status: 'completed' })
          .eq('id', routeId)
          .eq('driver_profile_id', user.id);

        if (routeUpdateError) {
          throw new Error(`Se completó la parada, pero falló actualización de ruta ${formatSupabaseError(routeUpdateError as QueryError)}`);
        }

        setRoute((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      }

      const { error: eventError } = await supabase.from('shipment_events').insert({
        route_stop_id: stopId,
        delivery_id: activeStop.delivery_id,
        event: 'completed',
        created_at: nowIso,
        payload: {
          route_id: routeId,
          tracking_code: activeStop.tracking_code,
          source: 'driver_route_detail',
        },
      });

      if (eventError) {
        console.error('[driver-route-detail] No se pudo registrar shipment_event completed', {
          stopId,
          eventError,
        });
      }

      toast.success('Parada completada');
      setActiveStop(null);
      router.refresh();
      await loadRoute();
    } catch (completeError) {
      setStops(previousStops);
      const message = completeError instanceof Error ? completeError.message : 'No se pudo completar la parada';
      setError(message);
      toast.error(message);
    } finally {
      setIsCompletingStop(false);
    }
  };

  if (isLoading) return <LoadingScreen message="Cargando detalles de ruta..." />;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Detalle de ruta</h1>
      <p className="mb-4 text-sm text-slate-500">
        {completedStops} de {stops.length} paradas completadas · Estado de ruta: {route?.status ?? 'active'}
      </p>

      {error ? <Card className="mb-4 p-4 text-sm text-red-600">{error}</Card> : null}

      <Card className="p-4">
        <div className="space-y-3">
          {stops.map((stop) => {
            const address = stop.address_text ?? '';
            const canComplete = stop.status === 'pending' || stop.status === 'in_progress';
            return (
              <div key={stop.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      #{stop.position || stop.stop_order} · {stop.title || stop.recipient_name || address || 'Parada'}
                    </p>
                    <p className="text-xs text-slate-500">{address || 'Dirección pendiente'}</p>
                    <p className="mt-1 text-xs text-slate-600">{stop.phone || 'Teléfono pendiente'}</p>
                    <p className="mt-1 text-xs capitalize text-slate-600">Estado: {stop.status}</p>
                  </div>

                  {canComplete ? (
                    <Button
                      size="sm"
                      onClick={() => setActiveStop(stop)}
                      disabled={isCompletingStop}
                    >
                      Completar
                    </Button>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                      {stop.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {!stops.length ? <p className="text-sm text-slate-500">Sin paradas disponibles.</p> : null}
        </div>
      </Card>

      <Dialog open={Boolean(activeStop)} onOpenChange={(open) => (!open ? setActiveStop(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar parada</DialogTitle>
            <DialogDescription>
              Esta acción marcará la parada como completada y actualizará el progreso de la ruta.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-700">
            #{activeStop?.position || activeStop?.stop_order} · {activeStop?.title || activeStop?.recipient_name || 'Parada'}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveStop(null)} disabled={isCompletingStop}>
              Cancelar
            </Button>
            <Button onClick={handleCompleteStop} disabled={isCompletingStop}>
              {isCompletingStop ? 'Completando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
