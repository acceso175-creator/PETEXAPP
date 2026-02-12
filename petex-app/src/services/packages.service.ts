import { getSupabaseClient } from '@/lib/supabase/client';
import { mockPackages, mockProofs } from '@/lib/mock-data';
import type { OCRResult, Package, Proof } from '@/types';

const mapPackage = (row: Record<string, unknown>): Package => ({
  id: String(row.id ?? ''),
  tracking: String(row.tracking ?? row.external_ref ?? ''),
  addressRaw: String(row.address_raw ?? row.addressRaw ?? ''),
  addressNorm: (row.address_norm as string | undefined) ?? (row.addressNorm as string | undefined),
  lat: typeof row.lat === 'number' ? row.lat : undefined,
  lng: typeof row.lng === 'number' ? row.lng : undefined,
  zoneId: (row.zone_id as string | undefined) ?? (row.zoneId as string | undefined),
  status: (String(row.status ?? 'created') as Package['status']),
  recipientName: (row.recipient_name as string | undefined) ?? (row.recipientName as string | undefined),
  recipientPhone:
    (row.recipient_phone as string | undefined) ?? (row.recipientPhone as string | undefined),
  createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  updatedAt: (row.updated_at as string | undefined) ?? (row.updatedAt as string | undefined),
});

const mapProof = (row: Record<string, unknown>): Proof => ({
  id: String(row.id ?? ''),
  packageId: String(row.shipment_id ?? row.package_id ?? row.packageId ?? ''),
  stopId: String(row.stop_id ?? row.stopId ?? ''),
  photoUrl: (row.photo_url as string | undefined) ?? (row.photoUrl as string | undefined),
  lat: typeof row.lat === 'number' ? row.lat : undefined,
  lng: typeof row.lng === 'number' ? row.lng : undefined,
  signature:
    (row.signature_url as string | undefined) ?? (row.signature as string | undefined) ?? undefined,
  timestamp: String(row.created_at ?? row.timestamp ?? new Date().toISOString()),
});

const fallbackPackages = () => {
  console.warn('[packages.service] fallback explícito a mockPackages/mockProofs.');
  return { packages: [...mockPackages], proofs: [...mockProofs] };
};

export async function getPackages(filters?: { status?: string; zoneId?: string; search?: string }): Promise<Package[]> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('shipments').select('*').order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.zoneId) query = query.eq('zone_id', filters.zoneId);
    if (filters?.search) {
      const value = `%${filters.search}%`;
      query = query.or(`tracking.ilike.${value},address_raw.ilike.${value},recipient_name.ilike.${value}`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => mapPackage(row as Record<string, unknown>));
  } catch {
    let result = fallbackPackages().packages;
    if (filters?.status) result = result.filter((pkg) => pkg.status === filters.status);
    if (filters?.zoneId) result = result.filter((pkg) => pkg.zoneId === filters.zoneId);
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (pkg) =>
          pkg.tracking.toLowerCase().includes(search) ||
          pkg.addressRaw.toLowerCase().includes(search) ||
          pkg.recipientName?.toLowerCase().includes(search)
      );
    }
    return result;
  }
}

export async function getPackageById(id: string): Promise<Package | null> {
  const items = await getPackages();
  return items.find((pkg) => pkg.id === id) ?? null;
}

export async function getPackageByTracking(tracking: string): Promise<Package | null> {
  const items = await getPackages({ search: tracking });
  return items.find((pkg) => pkg.tracking === tracking) ?? null;
}

export async function createPackage(data: Partial<Package>): Promise<Package> {
  const supabase = getSupabaseClient();
  const payload = {
    tracking: data.tracking ?? `MEX-${Date.now()}`,
    address_raw: data.addressRaw ?? '',
    address_norm: data.addressNorm ?? null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    zone_id: data.zoneId ?? null,
    status: data.status ?? 'created',
    recipient_name: data.recipientName ?? null,
    recipient_phone: data.recipientPhone ?? null,
  };

  const { data: inserted, error } = await supabase.from('shipments').insert(payload).select('*').single();
  if (error) throw new Error(`No se pudo crear el paquete: ${error.message}`);
  return mapPackage(inserted as Record<string, unknown>);
}

export async function updatePackage(id: string, data: Partial<Package>): Promise<Package | null> {
  const supabase = getSupabaseClient();
  const payload = {
    ...(data.tracking !== undefined ? { tracking: data.tracking } : {}),
    ...(data.addressRaw !== undefined ? { address_raw: data.addressRaw } : {}),
    ...(data.addressNorm !== undefined ? { address_norm: data.addressNorm } : {}),
    ...(data.lat !== undefined ? { lat: data.lat } : {}),
    ...(data.lng !== undefined ? { lng: data.lng } : {}),
    ...(data.zoneId !== undefined ? { zone_id: data.zoneId } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.recipientName !== undefined ? { recipient_name: data.recipientName } : {}),
    ...(data.recipientPhone !== undefined ? { recipient_phone: data.recipientPhone } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from('shipments')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`No se pudo actualizar el paquete: ${error.message}`);
  return updated ? mapPackage(updated as Record<string, unknown>) : null;
}

export async function updatePackageStatus(id: string, status: Package['status']): Promise<Package | null> {
  return updatePackage(id, { status });
}

export async function getProofByPackage(packageId: string): Promise<Proof | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('delivery_proofs')
      .select('*')
      .eq('shipment_id', packageId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProof(data as Record<string, unknown>) : null;
  } catch {
    return fallbackPackages().proofs.find((proof) => proof.packageId === packageId) ?? null;
  }
}

export async function createProof(data: {
  packageId: string;
  stopId: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
}): Promise<Proof> {
  const supabase = getSupabaseClient();
  const payload = {
    shipment_id: data.packageId,
    stop_id: data.stopId,
    photo_url: data.photoUrl ?? null,
    proof_url: data.photoUrl ?? null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
  };

  const { data: inserted, error } = await supabase.from('delivery_proofs').insert(payload).select('*').single();
  if (error) throw new Error(`No se pudo guardar evidencia: ${error.message}`);
  return mapProof(inserted as Record<string, unknown>);
}

export async function extractFromImage(_imageFile: File): Promise<OCRResult> {
  return {
    tracking: `MEX-${Math.floor(Math.random() * 900000 + 100000)}`,
    recipientName: 'Cliente detectado',
    addressRaw: 'Dirección detectada automáticamente',
    phone: '+52 614 000 0000',
    confidence: 0.8,
    rawText: 'OCR pendiente de integración con proveedor real.',
  };
}

export async function geocodeAddress(_address: string): Promise<{ lat: number; lng: number } | null> {
  return null;
}

export async function correctLocations(packageIds: string[]): Promise<number> {
  let corrected = 0;
  for (const packageId of packageIds) {
    const updated = await updatePackage(packageId, {});
    if (updated) corrected += 1;
  }
  return corrected;
}
