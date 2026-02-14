'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getZones, updateZone } from '@/services/zones.service';
import { MapPin, Save, MapPinOff, X } from 'lucide-react';
import type { Zone } from '@/types';

type ZoneDraft = Zone & { keywords: string[]; keywordInput: string };

export default function AdminZonesPage() {
  const [zones, setZones] = useState<ZoneDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const data = await getZones();
        setZones(data.map((z) => ({ ...z, keywords: z.keywords ?? [], keywordInput: '' })));
      } catch (error) {
        console.error('Error loading zones:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadZones();
  }, []);

  const addKeyword = (zoneId: string) => {
    setZones((prev) =>
      prev.map((zone) => {
        if (zone.id !== zoneId) return zone;
        const kw = zone.keywordInput.trim().toLowerCase();
        if (!kw || zone.keywords.includes(kw)) return { ...zone, keywordInput: '' };
        return { ...zone, keywords: [...zone.keywords, kw], keywordInput: '' };
      })
    );
  };

  const removeKeyword = (zoneId: string, keyword: string) => {
    setZones((prev) =>
      prev.map((zone) =>
        zone.id === zoneId ? { ...zone, keywords: zone.keywords.filter((kw) => kw !== keyword) } : zone
      )
    );
  };

  const saveZone = async (zone: ZoneDraft) => {
    try {
      setIsSavingId(zone.id);
      await updateZone(zone.id, { keywords: zone.keywords });
    } finally {
      setIsSavingId(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando zonas..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Zonas</h1>
        <p className="text-slate-500">Configura keywords para auto-asignación de pedidos por dirección/CP.</p>
      </div>

      {zones.length === 0 ? (
        <Card className="flex min-h-64 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <MapPinOff className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Aún no hay zonas registradas</h2>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {zones.map((zone) => (
            <Card key={zone.id} className="p-4">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${zone.color}20` }}>
                  <MapPin className="h-5 w-5" style={{ color: zone.color }} />
                </div>
                <div>
                  <h3 className="font-medium">{zone.name}</h3>
                  <p className="text-xs uppercase text-slate-500">{zone.color}</p>
                </div>
              </div>

              <p className="mb-2 text-xs font-medium text-slate-600">Keywords (barrios, CP, referencias)</p>
              <div className="mb-2 flex flex-wrap gap-1">
                {zone.keywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(zone.id, kw)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ej: 80020, centro, cantera"
                  value={zone.keywordInput}
                  onChange={(e) => setZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, keywordInput: e.target.value } : z))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addKeyword(zone.id);
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => addKeyword(zone.id)}>Agregar</Button>
              </div>

              <Button className="mt-3 w-full" onClick={() => saveZone(zone)} disabled={isSavingId === zone.id}>
                <Save className="mr-2 h-4 w-4" />Guardar keywords
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
