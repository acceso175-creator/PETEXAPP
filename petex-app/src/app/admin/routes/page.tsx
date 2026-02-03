// Admin routes page
'use client';

import { useEffect, useState } from 'react';
import { RouteCard } from '@/components/domain/route-card';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { getRoutes } from '@/services/routes.service';
import { getZoneById, getUserById } from '@/lib/mock-data';
import { Plus, Filter } from 'lucide-react';
import type { Route } from '@/types';

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const data = await getRoutes(
          filter !== 'all' ? { status: filter } : undefined
        );
        setRoutes(data);
      } catch (error) {
        console.error('Error loading routes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRoutes();
  }, [filter]);

  if (isLoading) {
    return <LoadingScreen message="Cargando rutas..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rutas</h1>
          <p className="text-slate-500">Gestión de rutas de entrega</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Ruta
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'draft', 'active', 'done'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            {f === 'all' ? 'Todas' : f === 'draft' ? 'Borrador' : f === 'active' ? 'Activas' : 'Completadas'}
          </Button>
        ))}
      </div>

      {/* Routes Grid */}
      {routes.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No hay rutas
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
              onAssign={() => {}}
              onDivide={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
