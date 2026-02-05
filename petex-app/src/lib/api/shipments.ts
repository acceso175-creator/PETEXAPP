export interface Shipment {
  id: string;
  tracking: string;
  status: string;
  city?: string | null;
  addressRaw?: string | null;
  addressNorm?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface DeliveryProof {
  id: string;
  shipmentId: string;
  photoUrl?: string | null;
  signatureUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt?: string | null;
}

export interface ShipmentFilters {
  status?: string;
  city?: string;
  search?: string;
}

const fetchJson = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  const payload = (await response.json()) as { data?: T; error?: string };

  if (!response.ok) {
    throw new Error(payload.error || 'No se pudo cargar la información.');
  }

  return (payload.data ?? null) as T;
};

export async function listShipments(filters: ShipmentFilters = {}): Promise<Shipment[]> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.city) {
    params.set('city', filters.city);
  }

  if (filters.search) {
    params.set('search', filters.search);
  }

  const query = params.toString();
  const url = query ? `/api/shipments?${query}` : '/api/shipments';

  return fetchJson<Shipment[]>(url);
}

export async function getShipment(id: string): Promise<Shipment> {
  return fetchJson<Shipment>(`/api/shipments/${id}`);
}

export async function listShipmentTimeline(id: string): Promise<ShipmentEvent[]> {
  return fetchJson<ShipmentEvent[]>(`/api/shipments/${id}/timeline`);
}

export async function listShipmentProofs(id: string): Promise<DeliveryProof[]> {
  return fetchJson<DeliveryProof[]>(`/api/shipments/${id}/proofs`);
}
