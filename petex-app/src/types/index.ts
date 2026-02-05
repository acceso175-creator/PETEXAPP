// Domain Models for PETEX-APP

export type UserRole = 'admin' | 'driver' | 'ops';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  active: boolean;
  avatarUrl?: string;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  polygonGeoJson?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export type PackageStatus = 'created' | 'assigned' | 'pending' | 'delivering' | 'delivered' | 'failed';

export interface Package {
  id: string;
  tracking: string;
  addressRaw: string;
  addressNorm?: string;
  lat?: number;
  lng?: number;
  zoneId?: string;
  status: PackageStatus;
  recipientName?: string;
  recipientPhone?: string;
  createdAt: string;
  updatedAt?: string;
}

export type RouteStatus = 'draft' | 'active' | 'done';

export interface Route {
  id: string;
  name: string;
  dateISO: string;
  zoneId: string;
  driverId?: string;
  status: RouteStatus;
  progressPct: number;
  totalStops: number;
  completedStops: number;
  estimatedTime?: string;
  createdAt: string;
}

export type StopStatus = 'pending' | 'delivered' | 'failed';

export interface Stop {
  id: string;
  routeId: string;
  packageId: string;
  order: number;
  status: StopStatus;
  deliveredAt?: string;
  failureReason?: string;
  notes?: string;
}

export interface Proof {
  id: string;
  packageId: string;
  stopId: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
  timestamp: string;
  signature?: string;
}

export type IssueScope = 'package' | 'route' | 'general';
export type IssueType = 'wrong_address' | 'no_access' | 'damaged' | 'recipient_absent' | 'other';
export type IssueStatus = 'open' | 'in_progress' | 'closed';

export interface Issue {
  id: string;
  scope: IssueScope;
  scopeId?: string;
  type: IssueType;
  note: string;
  photoUrl?: string;
  status: IssueStatus;
  reportedBy: string;
  createdAt: string;
  resolvedAt?: string;
}

export type TaskMessageStatus = 'queued' | 'sent' | 'read';

export interface TaskMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  subject?: string;
  text: string;
  priority: 'low' | 'normal' | 'high';
  status: TaskMessageStatus;
  createdAt: string;
  readAt?: string;
}

// Map types for future Google Maps integration
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  type: 'stop' | 'driver' | 'warehouse';
  status?: StopStatus | 'active';
}

export interface MapPolygon {
  id: string;
  coordinates: Array<{ lat: number; lng: number }>;
  fillColor: string;
  strokeColor: string;
  label?: string;
}

// OCR/AI extraction result
export interface OCRResult {
  tracking?: string;
  recipientName?: string;
  addressRaw?: string;
  phone?: string;
  confidence: number;
  rawText: string;
}

// Stats/Metrics
export interface DashboardStats {
  totalRoutes: number;
  activeRoutes: number;
  completedToday: number;
  pendingDeliveries: number;
  failedDeliveries: number;
  avgProgressPct: number;
  driversActive: number;
  issuesOpen: number;
}

export interface DriverStats {
  totalStops: number;
  completed: number;
  pending: number;
  failed: number;
  progressPct: number;
}
