// Root route fix: added driver app page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getDriverTodayRoute, getRouteStops } from '@/services/routes.service';
import { getPackageById } from '@/lib/mock-data';
import {
  Route as RouteIcon,
  MapPin,
  CheckCircle,
  Clock,
  ChevronRight,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import type { Route, Stop, DriverStats } from '@/types';

export default function DriverHomePage() {
  const { user } = useAuth();
  const [route, setRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const routeData = await getDriverTodayRoute(user.id);
        setRoute(routeData);
        if (routeData) {
          const stopsData = await getRouteStops(routeData.id);
          setStops(stopsData);
        }
      } catch (error) {
        console.error('Error loading route:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (isLoading) {
    return <LoadingScreen message="Cargando tu ruta..." />;
  }

  const stats: DriverStats = {
    totalStops: stops.length,
    completed: stops.filter((s) => s.status === 'delivered').length,
    pending: stops.filter((s) => s.status === 'pending').length,
    failed: stops.filter((s) => s.status === 'failed').length,
    progressPct: route?.progressPct || 0,
  };

  const nextStop = stops.find((s) => s.status === 'pending');
  const nextPackage = nextStop ? getPackageById(nextStop.packageId) : null;

  return (
    <div className="p-4">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          Hola, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-slate-500">
          {route ? route.name : 'Sin ruta asignada hoy'}
        </p>
      </div>

      {route ? (
        <>
          {/* Progress Card */}
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RouteIcon className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Progreso del día</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">
                {stats.progressPct}%
              </span>
            </div>
            <Progress value={stats.progressPct} className="h-3 mb-3" />
            <div className="flex justify-between text-sm text-slate-600">
              <span>{stats.completed} entregados</span>
              <span>{stats.pending} pendientes</span>
              {stats.failed > 0 && (
                <span className="text-red-600">{stats.failed} fallidos</span>
              )}
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              title="Paradas"
              value={`${stats.completed}/${stats.totalStops}`}
              icon={MapPin}
            />
            <StatCard
              title="Tiempo est."
              value={route.estimatedTime || '-'}
              icon={Clock}
            />
          </div>

          {/* Next Stop */}
          {nextStop && nextPackage && (
            <div className="mb-4">
              <h2 className="text-sm font-medium text-slate-500 mb-2">
                Siguiente parada
              </h2>
              <Link href="/app/route">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="font-bold text-orange-600">
                        {nextStop.order}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium">
                        {nextPackage.tracking}
                      </p>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {nextPackage.addressRaw}
                      </p>
                      {nextPackage.recipientName && (
                        <p className="text-sm text-slate-500 mt-1">
                          {nextPackage.recipientName}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </Card>
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/app/route">
              <Button variant="outline" className="w-full h-auto py-4">
                <div className="flex flex-col items-center gap-1">
                  <RouteIcon className="h-6 w-6 text-orange-600" />
                  <span>Ver Ruta</span>
                </div>
              </Button>
            </Link>
            <Link href="/app/scan">
              <Button className="w-full h-auto py-4 bg-orange-600 hover:bg-orange-700">
                <div className="flex flex-col items-center gap-1">
                  <Package className="h-6 w-6" />
                  <span>Escanear</span>
                </div>
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <RouteIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-medium text-slate-900 mb-2">
            Sin ruta asignada
          </h2>
          <p className="text-slate-500 text-sm">
            No tienes ninguna ruta asignada para hoy. Contacta a tu supervisor.
          </p>
        </Card>
      )}
    </div>
  );
}
