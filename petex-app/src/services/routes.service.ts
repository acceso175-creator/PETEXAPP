// Routes Service - Mock Implementation
// TODO: Replace with Supabase queries

import type { Route, Stop, DashboardStats } from '@/types';
import { mockRoutes, mockStops, mockPackages, mockUsers, mockIssues } from '@/lib/mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory state for mutations
let routes = [...mockRoutes];
let stops = [...mockStops];

export async function getRoutes(filters?: {
  status?: string;
  dateISO?: string;
  driverId?: string;
}): Promise<Route[]> {
  // TODO: Replace with Supabase query
  await delay(300);

  let result = [...routes];

  if (filters?.status) {
    result = result.filter(r => r.status === filters.status);
  }

  if (filters?.dateISO) {
    result = result.filter(r => r.dateISO === filters.dateISO);
  }

  if (filters?.driverId) {
    result = result.filter(r => r.driverId === filters.driverId);
  }

  return result;
}

export async function getRouteById(id: string): Promise<Route | null> {
  // TODO: Replace with Supabase query
  await delay(200);
  return routes.find(r => r.id === id) || null;
}

export async function getRouteStops(routeId: string): Promise<Stop[]> {
  // TODO: Replace with Supabase query with joins
  await delay(200);
  return stops.filter(s => s.routeId === routeId).sort((a, b) => a.order - b.order);
}

export async function getDriverTodayRoute(driverId: string): Promise<Route | null> {
  // TODO: Replace with Supabase query
  await delay(300);
  const today = new Date().toISOString().split('T')[0];
  return routes.find(r => r.driverId === driverId && r.dateISO === today && r.status === 'active') || null;
}

export async function createRoute(data: Partial<Route>): Promise<Route> {
  // TODO: Replace with Supabase insert
  await delay(400);

  const newRoute: Route = {
    id: `route-${Date.now()}`,
    name: data.name || 'Nueva Ruta',
    dateISO: data.dateISO || new Date().toISOString().split('T')[0],
    zoneId: data.zoneId || 'zone-001',
    driverId: data.driverId,
    status: 'draft',
    progressPct: 0,
    totalStops: 0,
    completedStops: 0,
    createdAt: new Date().toISOString(),
  };

  routes.push(newRoute);
  return newRoute;
}

export async function updateRoute(id: string, data: Partial<Route>): Promise<Route | null> {
  // TODO: Replace with Supabase update
  await delay(300);

  const index = routes.findIndex(r => r.id === id);
  if (index === -1) return null;

  routes[index] = { ...routes[index], ...data };
  return routes[index];
}

export async function assignDriver(routeId: string, driverId: string): Promise<Route | null> {
  // TODO: Replace with Supabase update
  return updateRoute(routeId, { driverId, status: 'active' });
}

export async function updateStopStatus(
  stopId: string,
  status: 'pending' | 'delivered' | 'failed',
  failureReason?: string
): Promise<Stop | null> {
  // TODO: Replace with Supabase update
  await delay(300);

  const index = stops.findIndex(s => s.id === stopId);
  if (index === -1) return null;

  stops[index] = {
    ...stops[index],
    status,
    deliveredAt: status === 'delivered' ? new Date().toISOString() : undefined,
    failureReason: status === 'failed' ? failureReason : undefined,
  };

  // Update route progress
  const routeId = stops[index].routeId;
  const routeStops = stops.filter(s => s.routeId === routeId);
  const completed = routeStops.filter(s => s.status === 'delivered').length;
  const routeIndex = routes.findIndex(r => r.id === routeId);

  if (routeIndex !== -1) {
    routes[routeIndex].completedStops = completed;
    routes[routeIndex].progressPct = Math.round((completed / routeStops.length) * 100);

    if (completed === routeStops.length) {
      routes[routeIndex].status = 'done';
    }
  }

  return stops[index];
}

export async function reorderStops(routeId: string, stopIds: string[]): Promise<Stop[]> {
  // TODO: Replace with Supabase batch update
  await delay(400);

  stopIds.forEach((stopId, index) => {
    const stopIndex = stops.findIndex(s => s.id === stopId);
    if (stopIndex !== -1) {
      stops[stopIndex].order = index + 1;
    }
  });

  return stops.filter(s => s.routeId === routeId).sort((a, b) => a.order - b.order);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // TODO: Replace with Supabase aggregate queries
  await delay(400);

  const today = new Date().toISOString().split('T')[0];
  const todayRoutes = routes.filter(r => r.dateISO === today);
  const activeRoutes = todayRoutes.filter(r => r.status === 'active');

  const todayStops = stops.filter(s => {
    const route = routes.find(r => r.id === s.routeId);
    return route?.dateISO === today;
  });

  return {
    totalRoutes: todayRoutes.length,
    activeRoutes: activeRoutes.length,
    completedToday: todayStops.filter(s => s.status === 'delivered').length,
    pendingDeliveries: todayStops.filter(s => s.status === 'pending').length,
    failedDeliveries: todayStops.filter(s => s.status === 'failed').length,
    avgProgressPct: activeRoutes.length > 0
      ? Math.round(activeRoutes.reduce((acc, r) => acc + r.progressPct, 0) / activeRoutes.length)
      : 0,
    driversActive: mockUsers.filter(u => u.role === 'driver' && u.active).length,
    issuesOpen: mockIssues.filter(i => i.status === 'open').length,
  };
}

// Divide route into two routes
export async function divideRoute(routeId: string, splitAtStopId: string): Promise<{ route1: Route; route2: Route } | null> {
  // TODO: Replace with Supabase transaction
  await delay(500);

  const route = routes.find(r => r.id === routeId);
  if (!route) return null;

  const routeStops = stops.filter(s => s.routeId === routeId).sort((a, b) => a.order - b.order);
  const splitIndex = routeStops.findIndex(s => s.id === splitAtStopId);

  if (splitIndex === -1 || splitIndex === 0) return null;

  // Create second route
  const newRoute: Route = {
    id: `route-${Date.now()}`,
    name: `${route.name} (Parte 2)`,
    dateISO: route.dateISO,
    zoneId: route.zoneId,
    status: 'draft',
    progressPct: 0,
    totalStops: routeStops.length - splitIndex,
    completedStops: 0,
    createdAt: new Date().toISOString(),
  };

  routes.push(newRoute);

  // Move stops to new route
  routeStops.slice(splitIndex).forEach((stop, idx) => {
    const stopIndex = stops.findIndex(s => s.id === stop.id);
    if (stopIndex !== -1) {
      stops[stopIndex].routeId = newRoute.id;
      stops[stopIndex].order = idx + 1;
    }
  });

  // Update original route
  const routeIndex = routes.findIndex(r => r.id === routeId);
  routes[routeIndex].totalStops = splitIndex;
  routes[routeIndex].name = `${route.name} (Parte 1)`;

  return { route1: routes[routeIndex], route2: newRoute };
}
