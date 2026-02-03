// Mock Data - Realistic data for Chihuahua, Mexico
import type {
  User,
  Zone,
  Package,
  Route,
  Stop,
  Proof,
  Issue,
  TaskMessage,
} from '@/types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// ============ USERS ============
export const mockUsers: User[] = [
  {
    id: 'admin-001',
    name: 'Carlos Mendoza',
    role: 'admin',
    email: 'carlos@petex.mx',
    phone: '+52 614 123 4567',
    active: true,
  },
  {
    id: 'admin-002',
    name: 'María García',
    role: 'admin',
    email: 'maria@petex.mx',
    phone: '+52 614 234 5678',
    active: true,
  },
  {
    id: 'driver-001',
    name: 'Juan Pérez',
    role: 'driver',
    phone: '+52 614 111 2222',
    active: true,
  },
  {
    id: 'driver-002',
    name: 'Roberto Sánchez',
    role: 'driver',
    phone: '+52 614 333 4444',
    active: true,
  },
  {
    id: 'driver-003',
    name: 'Luis Hernández',
    role: 'driver',
    phone: '+52 614 555 6666',
    active: true,
  },
  {
    id: 'driver-004',
    name: 'Miguel Torres',
    role: 'driver',
    phone: '+52 614 777 8888',
    active: false,
  },
];

// ============ ZONES (Chihuahua) ============
export const mockZones: Zone[] = [
  { id: 'zone-001', name: 'Centro', color: '#ef4444' },
  { id: 'zone-002', name: 'Cantera', color: '#f97316' },
  { id: 'zone-003', name: 'Norte', color: '#eab308' },
  { id: 'zone-004', name: 'San Felipe', color: '#22c55e' },
  { id: 'zone-005', name: 'Panamericana', color: '#3b82f6' },
  { id: 'zone-006', name: 'Las Quintas', color: '#8b5cf6' },
  { id: 'zone-007', name: 'Campos Elíseos', color: '#ec4899' },
  { id: 'zone-008', name: 'Riberas', color: '#14b8a6' },
];

// Chihuahua city center coordinates
const CHIHUAHUA_CENTER = { lat: 28.6353, lng: -106.0889 };

// ============ PACKAGES ============
export const mockPackages: Package[] = [
  {
    id: 'pkg-001',
    tracking: 'MEX-2024-001234',
    addressRaw: 'Av. Independencia 1200, Col. Centro',
    addressNorm: 'Av. Independencia #1200, Col. Centro, Chihuahua, Chih. 31000',
    lat: 28.6353,
    lng: -106.0889,
    zoneId: 'zone-001',
    status: 'delivering',
    recipientName: 'Ana López',
    recipientPhone: '+52 614 100 1001',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'pkg-002',
    tracking: 'MEX-2024-001235',
    addressRaw: 'Calle Victoria 456, Cantera',
    addressNorm: 'Calle Victoria #456, Col. Cantera, Chihuahua, Chih. 31100',
    lat: 28.6420,
    lng: -106.0750,
    zoneId: 'zone-002',
    status: 'delivering',
    recipientName: 'Pedro Martínez',
    recipientPhone: '+52 614 100 1002',
    createdAt: '2024-01-15T08:15:00Z',
  },
  {
    id: 'pkg-003',
    tracking: 'MEX-2024-001236',
    addressRaw: 'Blvd. Ortiz Mena 3400, Panamericana',
    addressNorm: 'Blvd. Ortiz Mena #3400, Col. Panamericana, Chihuahua, Chih. 31200',
    lat: 28.6510,
    lng: -106.1020,
    zoneId: 'zone-005',
    status: 'delivered',
    recipientName: 'Carmen Ruiz',
    recipientPhone: '+52 614 100 1003',
    createdAt: '2024-01-15T08:30:00Z',
  },
  {
    id: 'pkg-004',
    tracking: 'MEX-2024-001237',
    addressRaw: 'Calle 20 de Noviembre 789, Norte',
    lat: 28.6680,
    lng: -106.0800,
    zoneId: 'zone-003',
    status: 'pending',
    recipientName: 'Francisco Díaz',
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'pkg-005',
    tracking: 'MEX-2024-001238',
    addressRaw: 'Periférico de la Juventud 5500, Las Quintas',
    lat: 28.6200,
    lng: -106.1200,
    zoneId: 'zone-006',
    status: 'assigned',
    recipientName: 'Laura Vega',
    recipientPhone: '+52 614 100 1005',
    createdAt: '2024-01-15T09:15:00Z',
  },
  {
    id: 'pkg-006',
    tracking: 'MEX-2024-001239',
    addressRaw: 'Av. Teófilo Borunda 2100, San Felipe',
    lat: 28.6290,
    lng: -106.0650,
    zoneId: 'zone-004',
    status: 'delivering',
    recipientName: 'Jorge Núñez',
    createdAt: '2024-01-15T09:30:00Z',
  },
  {
    id: 'pkg-007',
    tracking: 'MEX-2024-001240',
    addressRaw: 'Calle Aldama 100, Centro',
    lat: 28.6340,
    lng: -106.0920,
    zoneId: 'zone-001',
    status: 'failed',
    recipientName: 'Sofía Morales',
    recipientPhone: '+52 614 100 1007',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'pkg-008',
    tracking: 'MEX-2024-001241',
    addressRaw: 'Av. Universidad 800, Campos Elíseos',
    lat: 28.6150,
    lng: -106.0550,
    zoneId: 'zone-007',
    status: 'assigned',
    recipientName: 'Diego Ramírez',
    createdAt: '2024-01-15T10:15:00Z',
  },
  {
    id: 'pkg-009',
    tracking: 'MEX-2024-001242',
    addressRaw: 'Blvd. Juan Pablo II 1500, Riberas',
    lat: 28.6080,
    lng: -106.0700,
    zoneId: 'zone-008',
    status: 'pending',
    recipientName: 'Elena Castro',
    recipientPhone: '+52 614 100 1009',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'pkg-010',
    tracking: 'MEX-2024-001243',
    addressRaw: 'Calle Juárez 250, Centro',
    lat: 28.6360,
    lng: -106.0870,
    zoneId: 'zone-001',
    status: 'delivered',
    recipientName: 'Ricardo Flores',
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'pkg-011',
    tracking: 'MEX-2024-001244',
    addressRaw: 'Av. División del Norte 3200, Norte',
    lat: 28.6750,
    lng: -106.0850,
    zoneId: 'zone-003',
    status: 'delivering',
    recipientName: 'Isabel Mendez',
    createdAt: '2024-01-15T11:15:00Z',
  },
  {
    id: 'pkg-012',
    tracking: 'MEX-2024-001245',
    addressRaw: 'Calle Libertad 600, Cantera',
    lat: 28.6400,
    lng: -106.0780,
    zoneId: 'zone-002',
    status: 'pending',
    recipientName: 'Arturo Silva',
    recipientPhone: '+52 614 100 1012',
    createdAt: '2024-01-15T11:30:00Z',
  },
];

// ============ ROUTES ============
export const mockRoutes: Route[] = [
  {
    id: 'route-001',
    name: 'Ruta Centro AM',
    dateISO: new Date().toISOString().split('T')[0],
    zoneId: 'zone-001',
    driverId: 'driver-001',
    status: 'active',
    progressPct: 65,
    totalStops: 12,
    completedStops: 8,
    estimatedTime: '2h 30min',
    createdAt: '2024-01-15T06:00:00Z',
  },
  {
    id: 'route-002',
    name: 'Ruta Norte Exprés',
    dateISO: new Date().toISOString().split('T')[0],
    zoneId: 'zone-003',
    driverId: 'driver-002',
    status: 'active',
    progressPct: 40,
    totalStops: 15,
    completedStops: 6,
    estimatedTime: '3h 15min',
    createdAt: '2024-01-15T06:30:00Z',
  },
  {
    id: 'route-003',
    name: 'Ruta Cantera-Panamericana',
    dateISO: new Date().toISOString().split('T')[0],
    zoneId: 'zone-002',
    driverId: 'driver-003',
    status: 'active',
    progressPct: 80,
    totalStops: 10,
    completedStops: 8,
    estimatedTime: '1h 45min',
    createdAt: '2024-01-15T07:00:00Z',
  },
  {
    id: 'route-004',
    name: 'Ruta Las Quintas PM',
    dateISO: new Date().toISOString().split('T')[0],
    zoneId: 'zone-006',
    status: 'draft',
    progressPct: 0,
    totalStops: 8,
    completedStops: 0,
    createdAt: '2024-01-15T07:30:00Z',
  },
  {
    id: 'route-005',
    name: 'Ruta Centro PM',
    dateISO: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    zoneId: 'zone-001',
    driverId: 'driver-001',
    status: 'done',
    progressPct: 100,
    totalStops: 14,
    completedStops: 14,
    createdAt: '2024-01-14T12:00:00Z',
  },
];

// ============ STOPS ============
export const mockStops: Stop[] = [
  { id: 'stop-001', routeId: 'route-001', packageId: 'pkg-001', order: 1, status: 'delivered', deliveredAt: '2024-01-15T09:30:00Z' },
  { id: 'stop-002', routeId: 'route-001', packageId: 'pkg-003', order: 2, status: 'delivered', deliveredAt: '2024-01-15T10:00:00Z' },
  { id: 'stop-003', routeId: 'route-001', packageId: 'pkg-007', order: 3, status: 'failed', failureReason: 'Destinatario ausente' },
  { id: 'stop-004', routeId: 'route-001', packageId: 'pkg-010', order: 4, status: 'delivered', deliveredAt: '2024-01-15T11:15:00Z' },
  { id: 'stop-005', routeId: 'route-001', packageId: 'pkg-004', order: 5, status: 'pending' },
  { id: 'stop-006', routeId: 'route-002', packageId: 'pkg-002', order: 1, status: 'delivered', deliveredAt: '2024-01-15T09:45:00Z' },
  { id: 'stop-007', routeId: 'route-002', packageId: 'pkg-006', order: 2, status: 'pending' },
  { id: 'stop-008', routeId: 'route-002', packageId: 'pkg-011', order: 3, status: 'pending' },
  { id: 'stop-009', routeId: 'route-003', packageId: 'pkg-005', order: 1, status: 'delivered', deliveredAt: '2024-01-15T08:30:00Z' },
  { id: 'stop-010', routeId: 'route-003', packageId: 'pkg-012', order: 2, status: 'pending' },
];

// ============ PROOFS ============
export const mockProofs: Proof[] = [
  {
    id: 'proof-001',
    packageId: 'pkg-001',
    stopId: 'stop-001',
    photoUrl: '/placeholder-proof.jpg',
    lat: 28.6353,
    lng: -106.0889,
    timestamp: '2024-01-15T09:30:00Z',
  },
  {
    id: 'proof-002',
    packageId: 'pkg-003',
    stopId: 'stop-002',
    photoUrl: '/placeholder-proof.jpg',
    lat: 28.6510,
    lng: -106.1020,
    timestamp: '2024-01-15T10:00:00Z',
  },
  {
    id: 'proof-003',
    packageId: 'pkg-010',
    stopId: 'stop-004',
    photoUrl: '/placeholder-proof.jpg',
    lat: 28.6360,
    lng: -106.0870,
    timestamp: '2024-01-15T11:15:00Z',
  },
];

// ============ ISSUES ============
export const mockIssues: Issue[] = [
  {
    id: 'issue-001',
    scope: 'package',
    scopeId: 'pkg-007',
    type: 'recipient_absent',
    note: 'El destinatario no se encontraba. Se dejó aviso.',
    status: 'open',
    reportedBy: 'driver-001',
    createdAt: '2024-01-15T10:45:00Z',
  },
  {
    id: 'issue-002',
    scope: 'package',
    scopeId: 'pkg-004',
    type: 'wrong_address',
    note: 'La dirección no existe, verificar con cliente.',
    status: 'open',
    reportedBy: 'driver-002',
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'issue-003',
    scope: 'route',
    scopeId: 'route-002',
    type: 'other',
    note: 'Calle cerrada por obras, se requiere ruta alternativa.',
    status: 'in_progress',
    reportedBy: 'driver-002',
    createdAt: '2024-01-15T09:00:00Z',
  },
];

// ============ TASK MESSAGES ============
export const mockTaskMessages: TaskMessage[] = [
  {
    id: 'msg-001',
    fromUserId: 'admin-001',
    toUserId: 'driver-001',
    subject: 'Prioridad: Entregar pkg-001',
    text: 'Por favor prioriza la entrega del paquete MEX-2024-001234. El cliente ha llamado 2 veces.',
    priority: 'high',
    status: 'read',
    createdAt: '2024-01-15T08:00:00Z',
    readAt: '2024-01-15T08:15:00Z',
  },
  {
    id: 'msg-002',
    fromUserId: 'admin-001',
    toUserId: 'driver-002',
    subject: 'Ruta Norte - Actualización',
    text: 'Se agregaron 3 paradas más a tu ruta. Revisa la app.',
    priority: 'normal',
    status: 'sent',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'msg-003',
    fromUserId: 'driver-001',
    toUserId: 'admin-001',
    subject: 'Problema con dirección',
    text: 'No encuentro la calle Aldama 100. El mapa marca otro lado.',
    priority: 'normal',
    status: 'read',
    createdAt: '2024-01-15T10:30:00Z',
    readAt: '2024-01-15T10:35:00Z',
  },
  {
    id: 'msg-004',
    fromUserId: 'admin-002',
    toUserId: 'driver-003',
    subject: 'Excelente trabajo',
    text: '¡Felicidades por completar todas las entregas a tiempo hoy!',
    priority: 'low',
    status: 'queued',
    createdAt: '2024-01-15T12:00:00Z',
  },
];

// Helper function to get zone by ID
export function getZoneById(id: string): Zone | undefined {
  return mockZones.find(z => z.id === id);
}

// Helper function to get user by ID
export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}

// Helper function to get package by ID
export function getPackageById(id: string): Package | undefined {
  return mockPackages.find(p => p.id === id);
}
