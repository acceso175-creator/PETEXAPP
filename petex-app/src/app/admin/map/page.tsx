'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPlaceholder } from '@/components/domain/map-placeholder';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getZones } from '@/services/zones.service';
import { getPackages } from '@/services/packages.service';
import { MapPinned } from 'lucide-react';
import type { MapMarker, MapPolygon, Package, Zone } from '@/types';

export default function AdminMapPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [zonesData, packagesData] = await Promise.all([getZones(), getPackages()]);
        setZones(zonesData);
        setPackages(packagesData);
      } catch (error) {
        console.error('Error loading map data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const markers: MapMarker[] = useMemo(
    () =>
      packages
        .filter((pkg) => pkg.lat !== undefined && pkg.lng !== undefined)
        .map((pkg) => ({
          id: pkg.id,
          lat: pkg.lat as number,
          lng: pkg.lng as number,
          label: pkg.tracking.slice(-4),
          type: 'stop' as const,
          status:
            pkg.status === 'delivered' ? 'delivered' : pkg.status === 'failed' ? 'failed' : 'pending',
        })),
    [packages]
  );

  const polygons: MapPolygon[] = useMemo(
    () =>
      zones.map((zone) => ({
        id: zone.id,
        coordinates: [],
        fillColor: zone.color,
        strokeColor: zone.color,
        label: zone.name,
      })),
    [zones]
  );

  if (isLoading) {
    return <LoadingScreen message="Cargando mapa operativo..." />;
  }

  return (
    <div className="h-[calc(100vh-2rem)] p-4 sm:p-6 lg:p-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Mapa</h1>
        <p className="text-slate-500">Vista general de entregas y zonas</p>
      </div>

      <div className="grid h-[calc(100%-4rem)] gap-4 lg:grid-cols-4">
        <MapPlaceholder markers={markers} polygons={polygons} className="h-full min-h-[400px] lg:col-span-3" />

        <Card className="h-fit p-4">
          <h3 className="mb-3 font-semibold">Zonas</h3>
          {zones.length === 0 ? (
            <p className="text-sm text-slate-500">Sin zonas registradas</p>
          ) : (
            <div className="space-y-2">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: zone.color }} />
                  <span className="text-sm">{zone.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 border-t pt-4">
            <h3 className="mb-3 font-semibold">Estados</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span>Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Entregado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Fallido</span>
              </div>
            </div>
          </div>

          {markers.length === 0 && (
            <div className="mt-4 rounded-lg border border-dashed p-3 text-center">
              <MapPinned className="mx-auto mb-2 h-5 w-5 text-slate-400" />
              <p className="text-xs text-slate-500">Todavía no hay entregas con coordenadas para mostrar.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
