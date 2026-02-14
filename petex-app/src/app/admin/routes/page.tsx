'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getSupabaseClient, supabaseConfigError } from '@/lib/supabase/client';
import { Upload, Route, MapPin, AlertTriangle } from 'lucide-react';

type DriverProfile = { id: string; full_name: string | null; email: string | null };
type Zone = { id: string; name: string; color: string; keywords: string[] };
type ParsedShipment = {
  external_ref: string | null;
  customer_name: string | null;
  phone: string | null;
  address: string;
  raw_row: Record<string, unknown>;
  zone_id: string | null;
  zone_reason: string;
};

type CreatedRouteResult = { zone: string; driver: string; shipments: number };

const CHUNK_SIZE = 150;

const todayLocalIso = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, '_');

const pick = (row: Record<string, unknown>, aliases: string[]) => {
  for (const [k, v] of Object.entries(row)) {
    const nk = normalizeKey(k);
    if (aliases.includes(nk) && v != null && String(v).trim()) return String(v).trim();
  }
  return null;
};

const parseCsv = async (file: File): Promise<Record<string, unknown>[]> => {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? '').trim();
    });
    return row;
  });
};

const parseXlsxIfAvailable = async (file: File): Promise<Record<string, unknown>[]> => {
  try {
    type XlsxModule = {
      read: (data: ArrayBuffer, opts: { type: 'array' }) => { SheetNames: string[]; Sheets: Record<string, unknown> };
      utils: { sheet_to_json: (sheet: unknown, opts: { defval: string }) => Record<string, unknown>[] };
    };
    const dynamicImport = (0, eval)('import("xlsx")') as Promise<XlsxModule>;
    const XLSX = await dynamicImport;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
  } catch {
    throw new Error('Este build no tiene soporte XLSX. Convierte el archivo a CSV para subirlo.');
  }
};

const normalizeRows = (rows: Record<string, unknown>[]): ParsedShipment[] =>
  rows
    .map((row) => {
      const external_ref = pick(row, ['ref', 'external_ref', 'reference', 'pedido', 'order_id']);
      const customer_name = pick(row, ['name', 'nombre', 'customer_name', 'cliente']);
      const phone = pick(row, ['phone', 'telefono', 'teléfono', 'mobile', 'celular']);
      const address = pick(row, ['address', 'direccion', 'dirección', 'street', 'domicilio']) ?? '';
      return {
        external_ref,
        customer_name,
        phone,
        address,
        raw_row: row,
        zone_id: null,
        zone_reason: 'sin asignar',
      };
    })
    .filter((row) => row.address.trim().length > 0);

const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

export default function AdminRoutesPage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [rows, setRows] = useState<ParsedShipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [singleDriverId, setSingleDriverId] = useState('');
  const [useSingleDriver, setUseSingleDriver] = useState(true);
  const [driverByZone, setDriverByZone] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CreatedRouteResult[]>([]);

  const zoneMap = useMemo(() => new Map(zones.map((z) => [z.id, z])), [zones]);

  useEffect(() => {
    const loadData = async () => {
      if (supabaseConfigError) {
        toast.error('Supabase no está configurado en este entorno.');
        setIsLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const [{ data: profiles, error: profilesError }, { data: zonesData, error: zonesError }] =
          await Promise.all([
            supabase.from('profiles').select('id,full_name,email').eq('role', 'driver').order('full_name'),
            supabase.from('zones').select('id,name,color,keywords').order('name'),
          ]);
        if (profilesError) throw profilesError;
        if (zonesError) throw zonesError;

        const nextDrivers = (profiles ?? []).map((d) => ({
          id: String(d.id),
          full_name: d.full_name ? String(d.full_name) : null,
          email: d.email ? String(d.email) : null,
        }));

        const nextZones = (zonesData ?? []).map((z) => ({
          id: String(z.id),
          name: String(z.name ?? 'Zona'),
          color: String(z.color ?? '#94a3b8'),
          keywords: Array.isArray(z.keywords) ? z.keywords.map((k) => String(k).toLowerCase()) : [],
        }));

        setDrivers(nextDrivers);
        setZones(nextZones);
        if (nextDrivers[0]) setSingleDriverId(nextDrivers[0].id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo cargar catálogo de rutas');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ParsedShipment[]>();
    for (const row of rows) {
      const key = row.zone_id ?? 'sin-zona';
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return map;
  }, [rows]);

  const handleFile = async (file: File) => {
    try {
      let rawRows: Record<string, unknown>[] = [];
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.csv')) rawRows = await parseCsv(file);
      else if (lower.endsWith('.xlsx')) rawRows = await parseXlsxIfAvailable(file);
      else throw new Error('Formato no soportado. Usa .csv o .xlsx');

      const normalized = normalizeRows(rawRows);
      setRows(normalized);
      setResult([]);
      toast.success(`Archivo cargado: ${normalized.length} pedidos válidos.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo leer el archivo');
    }
  };

  const assignZones = () => {
    const next = rows.map((row) => {
      const addressLower = row.address.toLowerCase();
      const cpMatch = addressLower.match(/\b\d{5}\b/);
      const byKeyword = zones.find((zone) => zone.keywords.some((kw) => addressLower.includes(kw)));
      const byCp = cpMatch ? zones.find((zone) => zone.keywords.includes(cpMatch[0])) : undefined;
      const winner = byKeyword ?? byCp;
      return {
        ...row,
        zone_id: winner?.id ?? null,
        zone_reason: winner ? `match ${winner.name}` : 'sin zona',
      };
    });
    setRows(next);
    toast.success('Zonas asignadas por keywords / código postal.');
  };

  const createRoutes = async () => {
    if (!rows.length) {
      toast.error('Carga pedidos antes de crear rutas.');
      return;
    }

    try {
      setIsSaving(true);
      const supabase = getSupabaseClient();
      const byRef = rows.filter((r) => r.external_ref);
      const noRef = rows.filter((r) => !r.external_ref);

      const shipmentIdByRef = new Map<string, string>();
      if (byRef.length) {
        const { data, error } = await supabase
          .from('shipments')
          .upsert(
            byRef.map((r) => ({
              external_ref: r.external_ref,
              customer_name: r.customer_name,
              phone: r.phone,
              address: r.address,
              raw_row: r.raw_row,
              zone_id: r.zone_id,
              status: 'pending',
            })),
            { onConflict: 'external_ref' }
          )
          .select('id,external_ref');
        if (error) throw error;
        (data ?? []).forEach((r) => {
          if (r.external_ref) shipmentIdByRef.set(String(r.external_ref), String(r.id));
        });
      }

      const insertedNoRef: { id: string }[] = [];
      if (noRef.length) {
        const { data, error } = await supabase
          .from('shipments')
          .insert(
            noRef.map((r) => ({
              customer_name: r.customer_name,
              phone: r.phone,
              address: r.address,
              raw_row: r.raw_row,
              zone_id: r.zone_id,
              status: 'pending',
            }))
          )
          .select('id');
        if (error) throw error;
        insertedNoRef.push(...((data ?? []) as { id: string }[]));
      }

      const rowsWithShipment = rows.map((r) => {
        if (r.external_ref) {
          const id = shipmentIdByRef.get(r.external_ref);
          return { row: r, shipment_id: id ?? null };
        }
        const next = insertedNoRef.shift();
        return { row: r, shipment_id: next?.id ?? null };
      });

      if (rowsWithShipment.some((r) => !r.shipment_id)) {
        throw new Error('No se pudieron resolver todos los shipment_id para crear route_stops.');
      }

      const created: CreatedRouteResult[] = [];
      for (const [zoneKey, zoneRows] of grouped.entries()) {
        const driverId = useSingleDriver ? singleDriverId : driverByZone[zoneKey] ?? '';
        if (!driverId) {
          throw new Error(`Falta seleccionar driver para grupo ${zoneKey}.`);
        }
        const groups = chunk(
          rowsWithShipment.filter((r) => (r.row.zone_id ?? 'sin-zona') === zoneKey),
          CHUNK_SIZE
        );

        for (const routeRows of groups) {
          const { data: routeData, error: routeError } = await supabase
            .from('routes')
            .insert({
              route_date: todayLocalIso(),
              zone_id: zoneKey === 'sin-zona' ? null : zoneKey,
              driver_profile_id: driverId,
              status: 'active',
            })
            .select('id')
            .single();
          if (routeError) throw routeError;

          const { error: stopsError } = await supabase.from('route_stops').insert(
            routeRows.map((item, index) => ({
              route_id: routeData.id,
              shipment_id: item.shipment_id,
              stop_order: index + 1,
              status: 'pending',
            }))
          );
          if (stopsError) throw stopsError;
        }

        created.push({
          zone: zoneKey === 'sin-zona' ? 'Sin zona' : zoneMap.get(zoneKey)?.name ?? zoneKey,
          driver: drivers.find((d) => d.id === driverId)?.full_name ?? driverId,
          shipments: zoneRows.length,
        });
      }

      setResult(created);
      toast.success(`Rutas creadas: ${created.length} grupos.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error creando rutas');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingScreen message="Cargando módulo de rutas..." />;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Card className="p-4">
        <h1 className="text-xl font-semibold text-slate-900">Ruteo masivo por archivo</h1>
        <p className="text-sm text-slate-500">Sube CSV/XLSX de pedidos, asigna zonas y crea rutas (máx 150 pedidos por ruta).</p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="file">Archivo</Label>
          <Input id="file" type="file" accept=".csv,.xlsx" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={assignZones} disabled={!rows.length}><MapPin className="mr-2 h-4 w-4" />Asignar zonas</Button>
          <Button variant={useSingleDriver ? 'default' : 'outline'} onClick={() => setUseSingleDriver(true)}>Driver único</Button>
          <Button variant={!useSingleDriver ? 'default' : 'outline'} onClick={() => setUseSingleDriver(false)}>Driver por zona</Button>
        </div>

        {useSingleDriver ? (
          <div className="mt-3 space-y-2">
            <Label>Driver</Label>
            <select className="w-full rounded-md border border-slate-200 p-2 text-sm" value={singleDriverId} onChange={(e) => setSingleDriverId(e.target.value)}>
              <option value="">Selecciona driver</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name ?? d.email ?? d.id}</option>)}
            </select>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {[...grouped.keys()].map((zoneKey) => (
              <div key={zoneKey} className="rounded border border-slate-200 p-2">
                <p className="mb-1 text-sm font-medium">{zoneKey === 'sin-zona' ? 'Sin zona' : zoneMap.get(zoneKey)?.name ?? zoneKey}</p>
                <select
                  className="w-full rounded-md border border-slate-200 p-2 text-sm"
                  value={driverByZone[zoneKey] ?? ''}
                  onChange={(e) => setDriverByZone((prev) => ({ ...prev, [zoneKey]: e.target.value }))}
                >
                  <option value="">Selecciona driver</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name ?? d.email ?? d.id}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        <Button className="mt-4 bg-orange-600 hover:bg-orange-700" onClick={createRoutes} disabled={isSaving || !rows.length}>
          <Route className="mr-2 h-4 w-4" />Crear rutas y asignar
        </Button>
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Upload className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold">Preview de pedidos ({rows.length})</h2>
        </div>
        {!rows.length ? (
          <p className="text-sm text-slate-500">Sube un archivo para previsualizar pedidos.</p>
        ) : (
          <div className="space-y-2">
            {rows.slice(0, 20).map((row, i) => (
              <div key={`${row.external_ref ?? 'no-ref'}-${i}`} className="rounded border border-slate-200 p-2 text-sm">
                <p><strong>{row.customer_name ?? 'Sin nombre'}</strong> · {row.phone ?? 'Sin teléfono'}</p>
                <p className="text-slate-600">{row.address}</p>
                <p className="text-xs text-slate-500">Zona: {row.zone_id ? zoneMap.get(row.zone_id)?.name ?? row.zone_id : 'Sin zona'} · {row.zone_reason}</p>
              </div>
            ))}
            {rows.some((r) => !r.zone_id) ? (
              <p className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />Hay pedidos sin zona; se agruparán en “Sin zona”.</p>
            ) : null}
          </div>
        )}
      </Card>

      {result.length ? (
        <Card className="p-4">
          <h3 className="text-sm font-semibold">Resultado</h3>
          {result.map((r, i) => (
            <p key={`${r.zone}-${i}`} className="text-sm text-slate-700">Zona {r.zone} · Driver {r.driver} · {r.shipments} pedidos</p>
          ))}
        </Card>
      ) : null}
    </div>
  );
}
