export type UserRole = 'admin' | 'driver';

export type DeliveryStatus = 'pendiente' | 'entregado' | 'fallido';

export interface Route {
  id: string;
  name: string;
  dateISO: string;
  zoneId: string;
  driverId?: string | null;
  status?: string;
  progressPct?: number;
  totalStops?: number;
  completedStops?: number;
  createdAt?: string;
}

export interface RouteStop {
  id: string;
  routeId: string;
  deliveryId: string;
  order: number;
  status: DeliveryStatus;
  deliveredAt?: string | null;
  failureReason?: string | null;
  notes?: string | null;
}

export interface Delivery {
  id: string;
  tracking: string;
  addressRaw: string;
  addressNorm?: string | null;
  lat?: number | null;
  lng?: number | null;
  zoneId?: string | null;
  status: DeliveryStatus;
  recipientName?: string | null;
  recipientPhone?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  failedReason?: string | null;
  deliveredAt?: string | null;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
  avatarUrl?: string | null;
}

export interface Event {
  id: string;
  type: string;
  message?: string | null;
  createdAt?: string;
  userId?: string | null;
  routeId?: string | null;
  deliveryId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface DeliveryEvent {
  id: string;
  deliveryId: string;
  actorUserId?: string | null;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
