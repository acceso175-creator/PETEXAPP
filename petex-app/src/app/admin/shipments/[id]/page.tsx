'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import {
  getShipment,
  listShipmentProofs,
  listShipmentTimeline,
  updateShipmentStatus,
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

export default function AdminShipmentDetailPage() {
  const params = useParams();
  const shipmentId = useMemo(() => params?.id as string, [params]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [proofs, setProofs] = useState<DeliveryProof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!shipmentId) return;
    if (supabaseConfigError) {
      setError(supabaseConfigError);
      setIsLoading(false);
      return;
    }

    try {
      const [shipmentData, eventsData, proofsData] = await Promise.all([
        getShipment(shipmentId),
        listShipmentTimeline(shipmentId),
        listShipmentProofs(shipmentId),
      ]);
      setShipment(shipmentData);
      setEvents(eventsData);
      setProofs(proofsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar el envío.';
      setError(message);
      toast.error('No se pudo cargar el envío');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shipmentId]);

  const handleStatusUpdate = async (status: string) => {
    if (!shipmentId) return;
    try {
      setIsUpdating(true);
      await updateShipmentStatus(shipmentId, status);
      await loadData();
      toast.success('Estado actualizado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar el estado.';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando envío..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Envío no encontrado</p>
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
        <h1 className="text-2xl font-bold text-slate-900">Detalle de envío</h1>
        <p className="text-slate-500">ID: {shipment.id}</p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-sm text-slate-700">
            {shipment.trackingCode || shipment.tracking || shipment.id}
          </span>
          <StatusBadge status={shipment.status} />
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          <p>{shipment.addressNorm || shipment.addressRaw || 'Dirección pendiente'}</p>
          {shipment.city && <p>Ciudad: {shipment.city}</p>}
          {shipment.recipientName && <p>Destinatario: {shipment.recipientName}</p>}
          {shipment.recipientPhone && <p>Tel: {shipment.recipientPhone}</p>}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            disabled={isUpdating}
            onClick={() => handleStatusUpdate('in_route')}
          >
            En ruta
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            disabled={isUpdating}
            onClick={() => handleStatusUpdate('delivered')}
          >
            Entregado
          </Button>
          <Button
            variant="destructive"
            disabled={isUpdating}
            onClick={() => handleStatusUpdate('incident')}
          >
            Incidente
          </Button>
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
            {proofs.map((proof) => {
              const proofLink = proof.proofUrl ?? proof.photoUrl ?? null;
              return (
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
                    {proofLink ? (
                      <a
                        href={proofLink}
                        className="text-orange-600 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver evidencia
                      </a>
                    ) : (
                      <p className="text-slate-500">Evidencia pendiente</p>
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
                    {proof.lat !== null &&
                      proof.lat !== undefined &&
                      proof.lng !== null &&
                      proof.lng !== undefined && (
                        <p>
                          Ubicación: {proof.lat.toFixed(5)}, {proof.lng.toFixed(5)}
                        </p>
                      )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
