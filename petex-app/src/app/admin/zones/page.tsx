// Admin zones page
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getZones } from '@/services/zones.service';
import { Plus, MapPin, Trash2, Edit } from 'lucide-react';
import type { Zone } from '@/types';

export default function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const data = await getZones();
        setZones(data);
      } catch (error) {
        console.error('Error loading zones:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadZones();
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Cargando zonas..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Zonas</h1>
          <p className="text-slate-500">Configuración de zonas de entrega</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Zona
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {zones.map((zone) => (
          <Card key={zone.id} className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${zone.color}20` }}
              >
                <MapPin className="h-5 w-5" style={{ color: zone.color }} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{zone.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded-full border-2"
                    style={{ backgroundColor: zone.color, borderColor: zone.color }}
                  />
                  <span className="text-xs text-slate-500 uppercase">
                    {zone.color}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
