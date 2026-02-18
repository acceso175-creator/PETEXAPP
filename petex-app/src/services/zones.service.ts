import { getSupabaseClient } from '@/lib/supabase/client';
import { mockZones } from '@/lib/mock-data';
import type { Zone } from '@/types';

const mapZone = (row: Record<string, unknown>): Zone => ({
  id: String(row.id ?? ''),
  name: String(row.name ?? 'Zona sin nombre'),
  color: String(row.color ?? '#6b7280'),
  polygonGeoJson:
    row.polygon_geojson && typeof row.polygon_geojson === 'object'
      ? (row.polygon_geojson as Zone['polygonGeoJson'])
      : undefined,
  keywords: Array.isArray(row.keywords) ? row.keywords.map((kw) => String(kw)) : [],
});

const fallbackZones = () => {
  console.warn('[zones.service] fallback explícito a mockZones (sin conexión o tabla no disponible).');
  return [...mockZones];
};

export async function getZones(): Promise<Zone[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('zones').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map((row) => mapZone(row as Record<string, unknown>));
  } catch {
    return fallbackZones();
  }
}

export async function getZoneById(id: string): Promise<Zone | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('zones').select('*').eq('id', id).single();
    if (error) throw error;
    return mapZone(data as Record<string, unknown>);
  } catch {
    return fallbackZones().find((zone) => zone.id === id) ?? null;
  }
}

export async function createZone(data: Partial<Zone>): Promise<Zone> {
  const supabase = getSupabaseClient();
  const payload = {
    name: data.name ?? 'Nueva zona',
    color: data.color ?? '#6b7280',
    polygon_geojson: data.polygonGeoJson ?? null,
    keywords: data.keywords ?? [],
  };

  const { data: inserted, error } = await supabase.from('zones').insert(payload).select('*').single();
  if (error) throw new Error(`No se pudo crear la zona: ${error.message}`);
  return mapZone(inserted as Record<string, unknown>);
}

export async function updateZone(id: string, data: Partial<Zone>): Promise<Zone | null> {
  const supabase = getSupabaseClient();
  const payload = {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.color !== undefined ? { color: data.color } : {}),
    ...(data.polygonGeoJson !== undefined ? { polygon_geojson: data.polygonGeoJson } : {}),
    ...(data.keywords !== undefined ? { keywords: data.keywords } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from('zones')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`No se pudo actualizar la zona: ${error.message}`);
  return updated ? mapZone(updated as Record<string, unknown>) : null;
}

export async function deleteZone(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('zones').delete().eq('id', id);
  if (error) throw new Error(`No se pudo eliminar la zona: ${error.message}`);
  return true;
}
