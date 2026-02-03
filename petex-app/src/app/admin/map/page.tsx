// Admin map page
'use client';

import { MapPlaceholder } from '@/components/domain/map-placeholder';
import { Card } from '@/components/ui/card';
import { mockPackages, mockZones } from '@/lib/mock-data';
import type { MapMarker, MapPolygon } from '@/types';

export default function AdminMapPage() {
  const markers: MapMarker[] = mockPackages
    .filter((p) => p.lat && p.lng)
    .map((p) => ({
      id: p.id,
      lat: p.lat!,
      lng: p.lng!,
      label: p.tracking.slice(-4),
      type: 'stop' as const,
      status: p.status === 'delivered' ? 'delivered' : p.status === 'failed' ? 'failed' : 'pending',
    }));

  const polygons: MapPolygon[] = mockZones.map((z, idx) => ({
    id: z.id,
    coordinates: [],
    fillColor: z.color,
    strokeColor: z.color,
    label: z.name,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-2rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Mapa</h1>
        <p className="text-slate-500">Vista general de entregas y zonas</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 h-[calc(100%-4rem)]">
        {/* Map */}
        <MapPlaceholder
          markers={markers}
          polygons={polygons}
          className="lg:col-span-3 h-full min-h-[400px]"
        />

        {/* Legend */}
        <Card className="p-4 h-fit">
          <h3 className="font-semibold mb-3">Zonas</h3>
          <div className="space-y-2">
            {mockZones.map((zone) => (
              <div key={zone.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
                <span className="text-sm">{zone.name}</span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4">
            <h3 className="font-semibold mb-3">Estados</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Entregado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Fallido</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
