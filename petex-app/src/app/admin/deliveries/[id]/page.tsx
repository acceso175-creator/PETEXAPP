'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import {
  getShipment,
  listShipmentProofs,
  listShipmentTimeline,
} from '@/lib/api/shipments';
import { supabaseConfigError } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { DeliveryProof, Shipment, ShipmentEvent } from '@/lib/api/shipments';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

const formatPayload = (event: ShipmentEvent) => {
  const payload = event.payload as { from?: string; to?: string; reason?: string };
  if (event.type === 'status_changed') {
    const title = payload.to
      ? `Estado actualizado a ${payload.to}`
      : 'Estado actualizado';
    const parts = [];
    if (payload.from) {
      parts.push(`De ${payload.from}`);
    }
    if (payload.reason) {
      parts.push(`Motivo: ${payload.reason}`);
    }
    return { title, description: parts.join(' • ') || undefined };
  }
  return { title: event.type };
};

export default function AdminDeliveryDetailPage() {
  const params = useParams();
  const deliveryId = useMemo(() => params?.id as string, [params]);
  const [delivery, setDelivery] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [proofs, setProofs] = useState<DeliveryProof[]>([]);
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
        const [deliveryData, eventsData, proofsData] = await Promise.all([
          getShipment(deliveryId),
          listShipmentTimeline(deliveryId),
          listShipmentProofs(deliveryId),
        ]);
        setDelivery(deliveryData);
        setEvents(eventsData);
        setProofs(proofsData);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo cargar la entrega';
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Detalle de entrega</h1>
        <p className="text-slate-500">ID: {delivery.id}</p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-sm text-slate-700">{delivery.tracking}</span>
          <StatusBadge status={delivery.status} />
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          <p>{delivery.addressNorm || delivery.addressRaw}</p>
          {delivery.city && <p>Ciudad: {delivery.city}</p>}
          {delivery.recipientName && <p>Destinatario: {delivery.recipientName}</p>}
          {delivery.recipientPhone && <p>Tel: {delivery.recipientPhone}</p>}
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Timeline</h2>
        {timelineItems.length === 0 ? (
          <Card className="p-4 text-sm text-slate-500">
            Aún no hay movimientos
          </Card>
        ) : (
          <div className="space-y-3">
            {timelineItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 whitespace-nowrap">
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

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Evidencia
        </h2>
        {proofs.length === 0 ? (
          <Card className="p-4 text-sm text-slate-500">Evidencia pendiente</Card>
        ) : (
          <div className="space-y-3">
            {proofs.map((proof) => (
              <Card key={proof.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>ID: {proof.id}</span>
                  {proof.createdAt && (
                    <span>
                      {new Date(proof.createdAt).toLocaleString('es-MX', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  {proof.photoUrl && (
                    <a
                      href={proof.photoUrl}
                      className="text-orange-600 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver foto de evidencia
                    </a>
                  )}
                  {proof.signatureUrl && (
                    <a
                      href={proof.signatureUrl}
                      className="text-orange-600 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver firma
                    </a>
                  )}
                  {proof.lat !== null && proof.lat !== undefined && proof.lng !== null && proof.lng !== undefined && (
                    <p>
                      Ubicación: {proof.lat.toFixed(5)}, {proof.lng.toFixed(5)}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
