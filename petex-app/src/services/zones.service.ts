// Zones Service - Mock Implementation
// TODO: Replace with Supabase queries

import type { Zone } from '@/types';
import { mockZones } from '@/lib/mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let zones = [...mockZones];

export async function getZones(): Promise<Zone[]> {
  // TODO: Replace with Supabase query
  await delay(200);
  return [...zones];
}

export async function getZoneById(id: string): Promise<Zone | null> {
  // TODO: Replace with Supabase query
  await delay(100);
  return zones.find(z => z.id === id) || null;
}

export async function createZone(data: Partial<Zone>): Promise<Zone> {
  // TODO: Replace with Supabase insert
  await delay(400);

  const newZone: Zone = {
    id: `zone-${Date.now()}`,
    name: data.name || 'Nueva Zona',
    color: data.color || '#6b7280',
    polygonGeoJson: data.polygonGeoJson,
  };

  zones.push(newZone);
  return newZone;
}

export async function updateZone(id: string, data: Partial<Zone>): Promise<Zone | null> {
  // TODO: Replace with Supabase update
  await delay(300);

  const index = zones.findIndex(z => z.id === id);
  if (index === -1) return null;

  zones[index] = { ...zones[index], ...data };
  return zones[index];
}

export async function deleteZone(id: string): Promise<boolean> {
  // TODO: Replace with Supabase delete
  await delay(300);

  const index = zones.findIndex(z => z.id === id);
  if (index === -1) return false;

  zones.splice(index, 1);
  return true;
}
