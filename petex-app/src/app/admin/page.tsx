// Root route fix: added admin page.tsx
'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { listShipments } from '@/lib/api/shipments';
import { supabaseConfigError } from '@/lib/supabase/client';
import { Package, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { Shipment } from '@/lib/api/shipments';

export default function AdminDashboardPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (supabaseConfigError) {
        setError(supabaseConfigError);
        setIsLoading(false);
        return;
      }

      try {
        const shipmentsData = await listShipments();
        setShipments(shipmentsData);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo cargar el dashboard.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Cargando dashboard..." />;
  }

  const statusCounts = shipments.reduce(
    (acc, shipment) => {
      const status = shipment.status || 'received';
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const visibleShipments = shipments.slice(0, 6);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Resumen de envíos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Recibidos"
          value={statusCounts.received || 0}
          icon={Package}
          iconClassName="bg-slate-200"
        />
        <StatCard
          title="En ruta"
          value={statusCounts.in_route || 0}
          icon={CheckCircle}
          iconClassName="bg-amber-100"
        />
        <StatCard
          title="Entregados"
          value={statusCounts.delivered || 0}
          icon={CheckCircle}
          iconClassName="bg-green-100"
        />
        <StatCard
          title="Incidentes"
          value={statusCounts.incident || 0}
          icon={XCircle}
          iconClassName="bg-red-100"
        />
      </div>

      {/* Shipments */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Envíos recientes
        </h2>
        {error ? (
          <Card className="p-4 text-sm text-red-600">{error}</Card>
        ) : shipments.length === 0 ? (
          <Card className="p-4 text-sm text-slate-500">
            Aún no hay movimientos
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleShipments.map((shipment) => (
              <Link key={shipment.id} href={`/admin/shipments/${shipment.id}`}>
                <Card className="p-4 space-y-2 hover:border-orange-200 hover:shadow-sm transition">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm text-slate-700 hover:text-orange-600">
                      {shipment.trackingCode || shipment.tracking || shipment.id}
                    </span>
                    <StatusBadge status={shipment.status} />
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    {shipment.city && <p>{shipment.city}</p>}
                    {shipment.addressNorm || shipment.addressRaw ? (
                      <p>{shipment.addressNorm || shipment.addressRaw}</p>
                    ) : null}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
