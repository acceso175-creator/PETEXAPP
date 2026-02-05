// Driver route page
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/state';
import { StopCard } from '@/components/domain/stop-card';
import { EvidenceModal } from '@/components/domain/evidence-modal';
import { FailureReasonModal } from '@/components/domain/failure-reason-modal';
import { MapPlaceholder } from '@/components/domain/map-placeholder';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getDriverTodayRoute, getRouteStops } from '@/services/routes.service';
import { createProof } from '@/services/packages.service';
import { getPackageById } from '@/lib/mock-data';
import { setDeliveryStatus } from '@/lib/api/deliveries';
import { toast } from 'sonner';
import type { Route, Stop, Package, MapMarker } from '@/types';

export default function DriverRoutePage() {
  const { user } = useAuth();
  const [route, setRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [evidenceModal, setEvidenceModal] = useState<{
    open: boolean;
    stop?: Stop;
    pkg?: Package;
  }>({ open: false });
  const [failureModal, setFailureModal] = useState<{
    open: boolean;
    stop?: Stop;
    pkg?: Package;
  }>({ open: false });
  const [updatingStopId, setUpdatingStopId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const routeData = await getDriverTodayRoute(user.id);
        setRoute(routeData);
        if (routeData) {
          const stopsData = await getRouteStops(routeData.id);
          setStops(stopsData);
        }
      } catch (error) {
        console.error('Error loading route:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleMarkDelivered = async (stop: Stop, pkg: Package) => {
    setEvidenceModal({ open: true, stop, pkg });
  };

  const handleConfirmDelivery = async (data: { photoUrl?: string; lat: number; lng: number }) => {
    if (!evidenceModal.stop || !evidenceModal.pkg) return;

    try {
      setUpdatingStopId(evidenceModal.stop.id);
      await createProof({
        packageId: evidenceModal.pkg.id,
        stopId: evidenceModal.stop.id,
        photoUrl: data.photoUrl,
        lat: data.lat,
        lng: data.lng,
      });
      await setDeliveryStatus(evidenceModal.pkg.id, 'entregado', {
        actorUserId: user?.id,
      });

      setStops((prev) =>
        prev.map((s) =>
          s.id === evidenceModal.stop?.id
            ? { ...s, status: 'delivered' as const, deliveredAt: new Date().toISOString() }
            : s
        )
      );
      toast.success('Entrega confirmada');
    } catch (error) {
      toast.error('Error al confirmar entrega');
    } finally {
      setUpdatingStopId(null);
      setEvidenceModal({ open: false });
    }
  };

  const handleMarkFailed = (stop: Stop, pkg: Package) => {
    setFailureModal({ open: true, stop, pkg });
  };

  const handleConfirmFailure = async (reason: string) => {
    if (!failureModal.stop || !failureModal.pkg) return;
    try {
      setUpdatingStopId(failureModal.stop.id);
      await setDeliveryStatus(failureModal.pkg.id, 'fallido', {
        reason,
        actorUserId: user?.id,
      });
      setStops((prev) =>
        prev.map((s) =>
          s.id === failureModal.stop?.id
            ? { ...s, status: 'failed' as const, failureReason: reason }
            : s
        )
      );
      toast.success('Entrega marcada como fallida');
    } catch (error) {
      toast.error('Error al actualizar entrega');
    } finally {
      setUpdatingStopId(null);
      setFailureModal({ open: false });
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando ruta..." />;
  }

  if (!route) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-500">No tienes ruta asignada hoy</p>
      </div>
    );
  }

  const markers: MapMarker[] = stops
    .map((stop) => {
      const pkg = getPackageById(stop.packageId);
      if (!pkg || !pkg.lat || !pkg.lng) return null;
      return {
        id: stop.id,
        lat: pkg.lat,
        lng: pkg.lng,
        label: String(stop.order),
        type: 'stop' as const,
        status: stop.status,
      };
    })
    .filter(Boolean) as MapMarker[];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Map */}
      <MapPlaceholder
        markers={markers}
        className="h-48 flex-shrink-0"
        showControls={false}
      />

      {/* Stops List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">
          {route.name} - {stops.length} paradas
        </h2>
        {stops.map((stop, idx) => {
          const pkg = getPackageById(stop.packageId);
          if (!pkg) return null;
          return (
            <StopCard
              key={stop.id}
              stop={stop}
              pkg={pkg}
              order={stop.order}
              isFirst={idx === 0}
              isLast={idx === stops.length - 1}
              onOpenEvidence={() => handleMarkDelivered(stop, pkg)}
              onMarkFailed={() => handleMarkFailed(stop, pkg)}
              isUpdating={updatingStopId === stop.id}
            />
          );
        })}
      </div>

      {/* Evidence Modal */}
      <EvidenceModal
        open={evidenceModal.open}
        onClose={() => setEvidenceModal({ open: false })}
        onConfirm={handleConfirmDelivery}
        packageTracking={evidenceModal.pkg?.tracking || ''}
        recipientName={evidenceModal.pkg?.recipientName}
      />

      <FailureReasonModal
        open={failureModal.open}
        onClose={() => setFailureModal({ open: false })}
        onConfirm={handleConfirmFailure}
        packageTracking={failureModal.pkg?.tracking || ''}
        recipientName={failureModal.pkg?.recipientName}
        isSubmitting={Boolean(updatingStopId)}
      />
    </div>
  );
}
