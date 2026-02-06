'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getSupabaseClient, supabaseConfigError } from '@/lib/supabase/client';

const STOP_STATUS = ['pending', 'in_progress', 'delivered', 'failed', 'cancelled'] as const;
type StopStatus = typeof STOP_STATUS[number];

type StopDetail = {
  id: string;
  stop_order: number;
  recipient_name: string | null;
  address: string | null;
  status: StopStatus;
};

function parseStopStatus(v: unknown): StopStatus {
  const s = String(v ?? '').trim().toLowerCase();
  return (STOP_STATUS as readonly string[]).includes(s) ? (s as StopStatus) : 'pending';
}

export default function DriverRouteDetailPage() {
  const params = useParams<{ routeId: string }>();
  const routeId = params?.routeId;
  const [stops, setStops] = useState<StopDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStops = async () => {
      if (!routeId) return;
      setIsLoading(true);

      if (supabaseConfigError) {
        setError('Supabase no está configurado.');
        setIsLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const { data, error: stopsError } = await supabase
          .from('route_stops')
          .select('id,stop_order,recipient_name,address,status')
          .eq('route_id', routeId)
          .order('stop_order', { ascending: true });

        if (stopsError) throw stopsError;
        setStops(
          (data ?? []).map((stop) => ({
            id: String(stop.id),
            stop_order: Number(stop.stop_order ?? 0),
            recipient_name: stop.recipient_name ? String(stop.recipient_name) : null,
            address: stop.address ? String(stop.address) : null,
            status: parseStopStatus(stop.status),
          }))
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la ruta');
      } finally {
        setIsLoading(false);
      }
    };

    loadStops();
  }, [routeId]);

  if (isLoading) return <LoadingScreen message="Cargando detalles de ruta..." />;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900">Detalle de ruta</h1>
      {error ? <Card className="p-4 text-sm text-red-600">{error}</Card> : null}
      <Card className="p-4">
        <div className="space-y-2">
          {stops.map((stop) => (
            <div key={stop.id} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-medium text-slate-900">
                #{stop.stop_order} · {stop.recipient_name || 'Destinatario'}
              </p>
              <p className="text-xs text-slate-500">{stop.address || 'Dirección pendiente'}</p>
              <p className="mt-1 text-xs capitalize text-slate-600">Estado: {stop.status}</p>
            </div>
          ))}
          {!stops.length ? <p className="text-sm text-slate-500">Sin paradas disponibles.</p> : null}
        </div>
      </Card>
    </div>
  );
}
