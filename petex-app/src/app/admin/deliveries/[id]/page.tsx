'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getDelivery, listDeliveryEvents } from '@/lib/api/deliveries';
import { supabaseConfigError } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Delivery, DeliveryEvent } from '@/lib/types/domain';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

const formatPayload = (event: DeliveryEvent) => {
  const payload = event.payload as { from?: string; to?: string; reason?: string };
  if (event.type === 'status_changed') {
    const title = payload.to ? `Estado actualizado a ${payload.to}` : 'Estado actualizado';
    const parts = [];
    if (payload.from) parts.push(`De ${payload.from}`);
    if (payload.reason) parts.push(`Motivo: ${payload.reason}`);
    return { title, description: parts.join(' • ') || undefined };
  }
  return { title: event.type };
};

export default function AdminDeliveryDetailPage() {
  const params = useParams();
  const deliveryId = useMemo(() => params?.id as string, [params]);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (supabaseConfigError) {
        setError(supabaseConfigError);
        setIsLoading(false);
        return;
      }

      try {
        const [deliveryData, eventsData] = await Promise.all([
          getDelivery(deliveryId),
          listDeliveryEvents(deliveryId),
        ]);
        setDelivery(deliveryData);
        setEvents(eventsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo cargar la entrega';
        setError(message);
        toast.error('No se pudo cargar la entrega');
      } finally {
        setIsLoading(false);
      }
    };

    if (deliveryId) {
      loadData();
    }
  }, [deliveryId]);

  if (isLoading) {
    return <LoadingScreen message="Cargando entrega..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Entrega no encontrada</p>
      </div>
    );
  }

  const timelineItems: TimelineItem[] = events.map((event) => {
    const { title, description } = formatPayload(event);
    return {
      id: event.id,
      title,
      description,
      createdAt: event.createdAt,
    };
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Detalle de entrega</h1>
        <p className="text-slate-500">ID: {delivery.id}</p>
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-slate-700">{delivery.tracking}</span>
          <StatusBadge status={delivery.status} />
        </div>
        <div className="space-y-1 text-sm text-slate-600">
          <p>{delivery.addressNorm || delivery.addressRaw}</p>
          {delivery.recipientName && <p>Destinatario: {delivery.recipientName}</p>}
          {delivery.recipientPhone && <p>Tel: {delivery.recipientPhone}</p>}
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Timeline</h2>
        {timelineItems.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            Aún no hay movimientos registrados para esta entrega.
          </Card>
        ) : (
          <div className="space-y-3">
            {timelineItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    {item.description && <p className="mt-1 text-sm text-slate-500">{item.description}</p>}
                  </div>
                  <p className="whitespace-nowrap text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
