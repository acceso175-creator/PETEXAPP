// Root route fix: added admin page.tsx
'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { RouteCard } from '@/components/domain/route-card';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getDashboardStats, getRoutes } from '@/services/routes.service';
import { getZoneById, getUserById } from '@/lib/mock-data';
import {
  Route as RouteIcon,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { DashboardStats, Route } from '@/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, routesData] = await Promise.all([
          getDashboardStats(),
          getRoutes({ status: 'active' }),
        ]);
        setStats(statsData);
        setRoutes(routesData);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Cargando dashboard..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Resumen del día</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Rutas Activas"
          value={stats?.activeRoutes || 0}
          subtitle={`de ${stats?.totalRoutes || 0} totales`}
          icon={RouteIcon}
        />
        <StatCard
          title="Entregas Hoy"
          value={stats?.completedToday || 0}
          icon={CheckCircle}
          iconClassName="bg-green-100"
        />
        <StatCard
          title="Pendientes"
          value={stats?.pendingDeliveries || 0}
          icon={Package}
          iconClassName="bg-amber-100"
        />
        <StatCard
          title="Fallidas"
          value={stats?.failedDeliveries || 0}
          icon={XCircle}
          iconClassName="bg-red-100"
        />
      </div>

      {/* Active Routes */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Rutas Activas
        </h2>
        {routes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No hay rutas activas
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                zone={route.zoneId ? getZoneById(route.zoneId) : undefined}
                driver={route.driverId ? getUserById(route.driverId) : undefined}
                onView={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
