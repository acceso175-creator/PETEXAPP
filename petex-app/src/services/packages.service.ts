// Packages Service - Mock Implementation
// TODO: Replace with Supabase queries

import type { Package, Proof, OCRResult } from '@/types';
import { mockPackages, mockProofs } from '@/lib/mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let packages = [...mockPackages];
let proofs = [...mockProofs];

export async function getPackages(filters?: {
  status?: string;
  zoneId?: string;
  search?: string;
}): Promise<Package[]> {
  // TODO: Replace with Supabase query
  await delay(300);

  let result = [...packages];

  if (filters?.status) {
    result = result.filter(p => p.status === filters.status);
  }

  if (filters?.zoneId) {
    result = result.filter(p => p.zoneId === filters.zoneId);
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(p =>
      p.tracking.toLowerCase().includes(search) ||
      p.addressRaw.toLowerCase().includes(search) ||
      p.recipientName?.toLowerCase().includes(search)
    );
  }

  return result;
}

export async function getPackageById(id: string): Promise<Package | null> {
  // TODO: Replace with Supabase query
  await delay(200);
  return packages.find(p => p.id === id) || null;
}

export async function getPackageByTracking(tracking: string): Promise<Package | null> {
  // TODO: Replace with Supabase query
  await delay(200);
  return packages.find(p => p.tracking === tracking) || null;
}

export async function createPackage(data: Partial<Package>): Promise<Package> {
  // TODO: Replace with Supabase insert
  await delay(400);

  const newPackage: Package = {
    id: `pkg-${Date.now()}`,
    tracking: data.tracking || `MEX-${Date.now()}`,
    addressRaw: data.addressRaw || '',
    addressNorm: data.addressNorm,
    lat: data.lat,
    lng: data.lng,
    zoneId: data.zoneId,
    status: 'created',
    recipientName: data.recipientName,
    recipientPhone: data.recipientPhone,
    createdAt: new Date().toISOString(),
  };

  packages.push(newPackage);
  return newPackage;
}

export async function updatePackage(id: string, data: Partial<Package>): Promise<Package | null> {
  // TODO: Replace with Supabase update
  await delay(300);

  const index = packages.findIndex(p => p.id === id);
  if (index === -1) return null;

  packages[index] = { ...packages[index], ...data, updatedAt: new Date().toISOString() };
  return packages[index];
}

export async function updatePackageStatus(
  id: string,
  status: Package['status']
): Promise<Package | null> {
  return updatePackage(id, { status });
}

// Proofs
export async function getProofByPackage(packageId: string): Promise<Proof | null> {
  // TODO: Replace with Supabase query
  await delay(200);
  return proofs.find(p => p.packageId === packageId) || null;
}

export async function createProof(data: {
  packageId: string;
  stopId: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
}): Promise<Proof> {
  // TODO: Replace with Supabase insert + storage upload
  await delay(500);

  const newProof: Proof = {
    id: `proof-${Date.now()}`,
    packageId: data.packageId,
    stopId: data.stopId,
    photoUrl: data.photoUrl || '/placeholder-proof.jpg',
    lat: data.lat || 28.6353 + (Math.random() - 0.5) * 0.01,
    lng: data.lng || -106.0889 + (Math.random() - 0.5) * 0.01,
    timestamp: new Date().toISOString(),
  };

  proofs.push(newProof);
  return newProof;
}

// OCR/AI Extraction
export async function extractFromImage(imageFile: File): Promise<OCRResult> {
  // TODO: Replace with OCR/LLM extraction API (OpenAI, Google Vision, etc.)
  await delay(1500); // Simulate processing time

  // Mock extraction result
  return {
    tracking: `MEX-2024-${Math.floor(Math.random() * 900000 + 100000)}`,
    recipientName: 'Cliente Ejemplo',
    addressRaw: 'Av. Independencia 1234, Col. Centro, Chihuahua',
    phone: '+52 614 ' + Math.floor(Math.random() * 900 + 100) + ' ' + Math.floor(Math.random() * 9000 + 1000),
    confidence: 0.85 + Math.random() * 0.1,
    rawText: 'GUÍA: MEX-2024-XXXXXX\nDESTINATARIO: Cliente Ejemplo\nDIRECCIÓN: Av. Independencia 1234...',
  };
}

// Geocoding placeholder
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // TODO: Replace with Google Maps Geocoding API
  await delay(500);

  // Return mock coordinates near Chihuahua center
  return {
    lat: 28.6353 + (Math.random() - 0.5) * 0.05,
    lng: -106.0889 + (Math.random() - 0.5) * 0.05,
  };
}

// Correct locations (batch geocoding)
export async function correctLocations(packageIds: string[]): Promise<number> {
  // TODO: Replace with batch Google Maps Geocoding
  await delay(1000);

  let corrected = 0;

  for (const id of packageIds) {
    const pkg = packages.find(p => p.id === id);
    if (pkg && pkg.addressRaw) {
      const coords = await geocodeAddress(pkg.addressRaw);
      if (coords) {
        const index = packages.findIndex(p => p.id === id);
        packages[index].lat = coords.lat;
        packages[index].lng = coords.lng;
        corrected++;
      }
    }
  }

  return corrected;
}
