'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getSupabaseClient, supabaseConfigError } from '@/lib/supabase/client';
import { Plus, Trash2, ArrowDown, ArrowUp } from 'lucide-react';

type DriverProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type RouteStopForm = {
  id?: string;
  localId: string;
  stop_order: number;
  title: string;
  address: string;
  lat: string;
  lng: string;
  status: string;
};

type RouteRow = {
  id: string;
  status: string;
};

const todayLocalIso = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const createStopDraft = (index: number): RouteStopForm => ({
  localId: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  stop_order: index + 1,
  title: '',
  address: '',
  lat: '',
  lng: '',
  status: 'pending',
});

export default function AdminRoutesPage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [route, setRoute] = useState<RouteRow | null>(null);
  const [stops, setStops] = useState<RouteStopForm[]>([]);
  const [removedStopIds, setRemovedStopIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId) ?? null,
    [drivers, selectedDriverId]
  );

  useEffect(() => {
    const loadDrivers = async () => {
      if (supabaseConfigError) {
        toast.error('Supabase no está configurado en este entorno.');
        setIsLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('id,full_name,email')
          .eq('role', 'driver')
          .order('full_name', { ascending: true });

        if (error) throw error;

        const nextDrivers = (data ?? []).map((row) => ({
          id: String(row.id),
          full_name: row.full_name ? String(row.full_name) : null,
          email: row.email ? String(row.email) : null,
        }));

        setDrivers(nextDrivers);
        if (nextDrivers.length > 0) {
          setSelectedDriverId(nextDrivers[0].id);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los drivers');
      } finally {
        setIsLoading(false);
      }
    };

    loadDrivers();
  }, []);

  useEffect(() => {
    const loadTodayRoute = async () => {
      if (!selectedDriverId || supabaseConfigError) {
        setRoute(null);
        setStops([]);
        setRemovedStopIds([]);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const today = todayLocalIso();
        const { data: routeData, error: routeError } = await supabase
          .from('routes')
          .select('id,status')
          .eq('driver_profile_id', selectedDriverId)
          .eq('route_date', today)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (routeError) throw routeError;

        if (!routeData) {
          setRoute(null);
          setStops([]);
          setRemovedStopIds([]);
          return;
        }

        setRoute({ id: String(routeData.id), status: String(routeData.status ?? 'assigned') });

        const { data: stopsData, error: stopsError } = await supabase
          .from('route_stops')
          .select('id,stop_order,title,address,lat,lng,status')
          .eq('route_id', routeData.id)
          .order('stop_order', { ascending: true });

        if (stopsError) throw stopsError;

        setStops(
          (stopsData ?? []).map((row, index) => ({
            id: String(row.id),
            localId: `saved-${row.id}`,
            stop_order: Number(row.stop_order ?? index + 1),
            title: row.title ? String(row.title) : '',
            address: row.address ? String(row.address) : '',
            lat: row.lat != null ? String(row.lat) : '',
            lng: row.lng != null ? String(row.lng) : '',
            status: row.status ? String(row.status) : 'pending',
          }))
        );
        setRemovedStopIds([]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo cargar la ruta del driver');
      }
    };

    loadTodayRoute();
  }, [selectedDriverId]);

  const reindexStops = (nextStops: RouteStopForm[]) =>
    nextStops.map((stop, index) => ({ ...stop, stop_order: index + 1 }));

  const handleCreateRouteToday = async () => {
    if (!selectedDriverId) {
      toast.error('Selecciona un driver antes de crear la ruta.');
      return;
    }

    if (route) {
      toast.success('Este driver ya tiene ruta para hoy.');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const today = todayLocalIso();
      const { data, error } = await supabase
        .from('routes')
        .insert({
          driver_profile_id: selectedDriverId,
          route_date: today,
          status: 'assigned',
        })
        .select('id,status')
        .single();

      if (error) throw error;

      setRoute({ id: String(data.id), status: String(data.status ?? 'assigned') });
      setStops([]);
      setRemovedStopIds([]);
      toast.success('Ruta de hoy creada. Ahora agrega las paradas.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la ruta');
    }
  };

  const handleStopChange = (localId: string, field: keyof RouteStopForm, value: string) => {
    setStops((prev) =>
      prev.map((stop) => (stop.localId === localId ? { ...stop, [field]: value } : stop))
    );
  };

  const handleAddStop = () => {
    setStops((prev) => [...prev, createStopDraft(prev.length)]);
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    setStops((prev) => {
      const toIndex = index + direction;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(toIndex, 0, item);
      return reindexStops(next);
    });
  };

  const handleDeleteStop = (localId: string) => {
    setStops((prev) => {
      const stop = prev.find((item) => item.localId === localId);
      if (stop?.id) {
        setRemovedStopIds((existing) => [...existing, stop.id as string]);
      }
      return reindexStops(prev.filter((item) => item.localId !== localId));
    });
  };

  const handleSave = async () => {
    if (!route) {
      toast.error('Primero crea una ruta para hoy.');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = getSupabaseClient();

      const normalizedStops = reindexStops(stops);
      const updateRows = normalizedStops.filter((stop) => stop.id);
      const insertRows = normalizedStops.filter((stop) => !stop.id);

      for (const stop of updateRows) {
        const { error } = await supabase
          .from('route_stops')
          .update({
            stop_order: stop.stop_order,
            title: stop.title.trim() || null,
            address: stop.address.trim() || null,
            lat: stop.lat.trim() ? Number(stop.lat) : null,
            lng: stop.lng.trim() ? Number(stop.lng) : null,
            status: stop.status,
          })
          .eq('id', stop.id as string);

        if (error) throw error;
      }

      if (insertRows.length > 0) {
        const { error } = await supabase.from('route_stops').insert(
          insertRows.map((stop) => ({
            route_id: route.id,
            stop_order: stop.stop_order,
            title: stop.title.trim() || null,
            address: stop.address.trim() || null,
            lat: stop.lat.trim() ? Number(stop.lat) : null,
            lng: stop.lng.trim() ? Number(stop.lng) : null,
            status: stop.status,
          }))
        );

        if (error) throw error;
      }

      if (removedStopIds.length > 0) {
        const { error } = await supabase.from('route_stops').delete().in('id', removedStopIds);
        if (error) throw error;
      }

      toast.success('Ruta guardada correctamente');

      const { data: stopsData, error: stopsError } = await supabase
        .from('route_stops')
        .select('id,stop_order,title,address,lat,lng,status')
        .eq('route_id', route.id)
        .order('stop_order', { ascending: true });

      if (stopsError) throw stopsError;

      setStops(
        (stopsData ?? []).map((row, index) => ({
          id: String(row.id),
          localId: `saved-${row.id}`,
          stop_order: Number(row.stop_order ?? index + 1),
          title: row.title ? String(row.title) : '',
          address: row.address ? String(row.address) : '',
          lat: row.lat != null ? String(row.lat) : '',
          lng: row.lng != null ? String(row.lng) : '',
          status: row.status ? String(row.status) : 'pending',
        }))
      );
      setRemovedStopIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la ruta');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando asignación de rutas..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Asignar ruta a driver</h1>
        <p className="text-slate-500">Crea la ruta de hoy y administra sus paradas.</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="driver-selector">Driver</Label>
          <select
            id="driver-selector"
            value={selectedDriverId}
            onChange={(event) => setSelectedDriverId(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {!drivers.length ? <option value="">Sin drivers disponibles</option> : null}
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.full_name || driver.email || driver.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleCreateRouteToday} className="bg-orange-600 hover:bg-orange-700" disabled={!selectedDriverId || Boolean(route)}>
            Crear ruta de hoy
          </Button>
          {route ? <p className="text-sm text-emerald-700">Ruta activa para hoy: {route.id.slice(0, 8)}…</p> : <p className="text-sm text-slate-500">Este driver aún no tiene ruta para hoy.</p>}
        </div>
        {selectedDriver ? (
          <p className="text-xs text-slate-500">
            Driver seleccionado: <span className="font-medium text-slate-700">{selectedDriver.full_name || selectedDriver.email || selectedDriver.id}</span>
          </p>
        ) : null}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Paradas</h2>
            <p className="text-xs text-slate-500">CRUD básico: agrega, reordena y elimina antes de guardar.</p>
          </div>
          <Button variant="outline" onClick={handleAddStop} disabled={!route}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar parada
          </Button>
        </div>

        {!route ? (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Primero crea la ruta de hoy para habilitar la edición de paradas.
          </p>
        ) : stops.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Esta ruta todavía no tiene paradas. Agrega la primera parada para comenzar.
          </p>
        ) : (
          <div className="space-y-3">
            {stops.map((stop, index) => (
              <Card key={stop.localId} className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">Parada #{stop.stop_order}</p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => moveStop(index, -1)} disabled={index === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => moveStop(index, 1)} disabled={index === stops.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteStop(stop.localId)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder="Título o nombre del destinatario"
                    value={stop.title}
                    onChange={(event) => handleStopChange(stop.localId, 'title', event.target.value)}
                  />
                  <Input
                    placeholder="Dirección"
                    value={stop.address}
                    onChange={(event) => handleStopChange(stop.localId, 'address', event.target.value)}
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder="Latitud"
                    value={stop.lat}
                    onChange={(event) => handleStopChange(stop.localId, 'lat', event.target.value)}
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder="Longitud"
                    value={stop.lng}
                    onChange={(event) => handleStopChange(stop.localId, 'lng', event.target.value)}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}

        <Button onClick={handleSave} disabled={!route || isSaving} className="bg-orange-600 hover:bg-orange-700">
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </Card>
    </div>
  );
}
