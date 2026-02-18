'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getSupabaseClient, supabaseConfigError } from '@/lib/supabase/client';
import { Upload, Route, MapPin, AlertTriangle } from 'lucide-react';

type DriverProfile = { id: string; full_name: string | null; email: string | null };
type Zone = { id: string; name: string; color: string };
type NormalizedRow = {
  order_id: string;
  customer_name: string;
  phone: string;
  address_line1: string;
  city: string;
  postal_code: string;
  zone_hint: string;
  carrier: string;
  notes: string;
  raw_row: Record<string, unknown>;
  is_valid: boolean;
  errors: string[];
  zone_id: string | null;
  zone_reason: string;
};

type CreatedRouteResult = { group: string; driver: string; shipments: number; routes: number };

const CHUNK_SIZE = 150;

const ALIASES: Record<string, string[]> = {
  order_id: ['order_id', 'pedido', 'pedido_id', 'id_pedido'],
  customer_name: ['customer_name', 'cliente', 'nombre', 'full_name'],
  phone: ['phone', 'telefono', 'tel', 'celular'],
  address_line1: ['address', 'direccion', 'domicilio', 'address_line1'],
  city: ['city', 'ciudad'],
  postal_code: ['postal_code', 'cp', 'zip'],
  zone_hint: ['zone', 'zona', 'zone_hint'],
  carrier: ['carrier', 'paqueteria', 'paquetería', 'courier', 'transportadora'],
  notes: ['notes', 'nota', 'notas', 'observaciones'],
};

const todayLocalIso = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const inferCarrierFromTracking = (trackingCode: string) => {
  const code = trackingCode.trim().toUpperCase();
  if (code.startsWith('ML-')) return 'MercadoLibre';
  if (code.startsWith('SHE-')) return 'SHEIN';
  if (code.startsWith('JT-')) return 'J&T';
  return 'PETEX';
};

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const parseDelimitedLine = (line: string, delimiter: string) => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const detectDelimiter = (headerLine: string) => {
  const delimiters = [',', ';', '\t'];
  const counts = delimiters.map((d) => ({ d, count: headerLine.split(d).length }));
  counts.sort((a, b) => b.count - a.count);
  return counts[0].d;
};

const parseCsv = async (file: File): Promise<Record<string, unknown>[]> => {
  const text = (await file.text()).replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseDelimitedLine(lines[0], delimiter).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
};

const getValueByAliases = (row: Record<string, unknown>, aliases: string[]) => {
  const normalizedEntries = Object.entries(row).map(([k, v]) => [normalizeHeader(k), v] as const);
  for (const alias of aliases) {
    const hit = normalizedEntries.find(([k]) => k === normalizeHeader(alias));
    if (!hit) continue;
    const v = hit[1];
    if (v == null) continue;
    const txt = String(v).trim();
    if (txt.length > 0) return txt;
  }
  return '';
};

const normalizeRows = (rows: Record<string, unknown>[]): NormalizedRow[] =>
  rows.map((row) => {
    const order_id = getValueByAliases(row, ALIASES.order_id);
    const customer_name = getValueByAliases(row, ALIASES.customer_name);
    const phone = getValueByAliases(row, ALIASES.phone);
    const address_line1 = getValueByAliases(row, ALIASES.address_line1);
    const city = getValueByAliases(row, ALIASES.city);
    const postal_code = getValueByAliases(row, ALIASES.postal_code);
    const zone_hint = getValueByAliases(row, ALIASES.zone_hint);
    const carrier = getValueByAliases(row, ALIASES.carrier);
    const notes = getValueByAliases(row, ALIASES.notes);

    const errors: string[] = [];
    if (!order_id) errors.push('Falta order_id/pedido');
    if (!address_line1) errors.push('Falta dirección');
    if (!phone && !customer_name) errors.push('Debe tener teléfono o cliente');

    return {
      order_id,
      customer_name,
      phone,
      address_line1,
      city,
      postal_code,
      zone_hint,
      carrier,
      notes,
      raw_row: row,
      is_valid: errors.length === 0,
      errors,
      zone_id: null,
      zone_reason: 'sin asignar',
    };
  });

const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

export default function AdminRoutesPage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [rows, setRows] = useState<NormalizedRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [singleDriverId, setSingleDriverId] = useState('');
  const [useSingleDriver, setUseSingleDriver] = useState(true);
  const [driverByGroup, setDriverByGroup] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CreatedRouteResult[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const validRows = useMemo(() => rows.filter((row) => row.is_valid), [rows]);
  const invalidRows = useMemo(() => rows.filter((row) => !row.is_valid), [rows]);
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
            supabase.from('zones').select('id,name,color').order('name'),
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
          color: z.color ? String(z.color) : '#6B7280',
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

  const groupedRows = useMemo(() => {
    const map = new Map<string, NormalizedRow[]>();
    const source = validRows;
    if (useSingleDriver) {
      map.set('global', source);
      return map;
    }

    for (const row of source) {
      const key = row.zone_id ?? (row.zone_hint.trim().toLowerCase() || 'sin-zona');
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return map;
  }, [useSingleDriver, validRows]);

  const handleFile = async (file: File) => {
    try {
      let rawRows: Record<string, unknown>[] = [];
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.csv')) rawRows = await parseCsv(file);
      else throw new Error('Formato no soportado. Usa únicamente .csv');

      const normalized = normalizeRows(rawRows);
      setRows(normalized);
      setResult([]);
      setIsImportDialogOpen(false);
      toast.success(`Archivo cargado: ${normalized.filter((r) => r.is_valid).length} pedidos válidos.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo leer el archivo');
    }
  };

  const assignZones = () => {
    const next = rows.map((row) => {
      if (!row.is_valid) return row;
      const search = [row.address_line1, row.city, row.postal_code, row.zone_hint].join(' ').toLowerCase();
      const winner = zones.find((zone) => {
        const zoneName = zone.name.toLowerCase();
        return search.includes(zoneName) || (row.zone_hint && zoneName.includes(row.zone_hint.toLowerCase()));
      });
      return {
        ...row,
        zone_id: winner?.id ?? null,
        zone_reason: winner ? `match ${winner.name}` : 'sin zona',
      };
    });
    setRows(next);
    toast.success('Zonas asignadas por nombre/pista de zona.');
  };

  const createRoutes = async () => {
    if (!validRows.length) {
      toast.error('No hay filas válidas para crear rutas.');
      return;
    }

    try {
      setIsSaving(true);
      const supabase = getSupabaseClient();

      const { data: upserted, error: shipmentError } = await supabase
        .from('shipments')
        .upsert(
          validRows.map((row) => ({
            tracking_code: row.order_id,
            carrier: row.carrier || inferCarrierFromTracking(row.order_id),
            recipient_name: row.customer_name || null,
            recipient_phone: row.phone || null,
            city: row.city || null,
            neighborhood: row.zone_hint || null,
            address_line: row.address_line1,
            postal_code: row.postal_code || null,
            status: 'created',
            notes: row.notes || null,
          })),
          { onConflict: 'tracking_code' }
        )
        .select('id,tracking_code,recipient_phone,address_line');

      if (shipmentError) throw shipmentError;
      const shipmentIdByOrder = new Map<string, string>();
      (upserted ?? []).forEach((item) => {
        if (item.tracking_code) shipmentIdByOrder.set(String(item.tracking_code), String(item.id));
      });

      const created: CreatedRouteResult[] = [];
      for (const [groupKey, groupRows] of groupedRows.entries()) {
        const driverId = useSingleDriver ? singleDriverId : driverByGroup[groupKey] ?? '';
        if (!driverId) throw new Error(`Falta seleccionar driver para el grupo ${groupKey}.`);

        const chunks = chunk(groupRows, CHUNK_SIZE);
        for (const slice of chunks) {
          const zoneId = useSingleDriver ? null : slice[0]?.zone_id ?? null;
          const { data: routeData, error: routeError } = await supabase
            .from('routes')
            .insert({
              route_date: todayLocalIso(),
              zone_id: zoneId,
              driver_profile_id: driverId,
              status: 'active',
            })
            .select('id')
            .single();

          if (routeError) throw routeError;

          const stopsPayload = slice.map((row, index) => {
            const shipmentId = shipmentIdByOrder.get(row.order_id);
            if (!shipmentId) throw new Error(`No se encontró shipment para order_id ${row.order_id}`);
            const title = row.customer_name || row.address_line1 || 'Parada';
            return {
              route_id: routeData.id,
              position: index + 1,
              stop_order: index + 1,
              title: row.customer_name || row.order_id || 'Parada',
              address_text: row.address_line1,
              meta: {
                shipment_id: shipmentId,
                order_id: row.order_id,
                customer_name: row.customer_name,
                phone: row.phone,
                zone_hint: row.zone_hint,
                city: row.city,
                postal_code: row.postal_code,
              },
            };
          });

          const { error: stopsError } = await supabase.from('route_stops').insert(stopsPayload);
          if (stopsError) throw stopsError;
        }

        created.push({
          group:
            groupKey === 'global'
              ? 'Driver único'
              : (zoneMap.get(groupKey)?.name ?? (groupRows[0]?.zone_hint || 'Sin zona')),
          driver: drivers.find((driver) => driver.id === driverId)?.full_name ?? driverId,
          shipments: groupRows.length,
          routes: chunks.length,
        });
      }

      setResult(created);
      toast.success(`Proceso completado: ${created.reduce((acc, x) => acc + x.routes, 0)} rutas creadas.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error creando rutas');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingScreen message="Cargando módulo de ruteo masivo..." />;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Card className="p-4">
        <h1 className="text-xl font-semibold text-slate-900">Ruteo masivo por CSV</h1>
        <p className="text-sm text-slate-500">Carga CSV y crea rutas chunked de máximo 150 pedidos.</p>
        <div className="mt-4">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Cargar CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle className="sr-only">Importar pedidos por CSV</DialogTitle>
              <DialogDescription className="sr-only">
                Selecciona un archivo CSV para importar pedidos y generar rutas masivas.
              </DialogDescription>
              <div className="space-y-2">
                <Label htmlFor="file">Archivo CSV</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={assignZones} disabled={!rows.length}>
            <MapPin className="mr-2 h-4 w-4" />Asignar zonas
          </Button>
          <Button variant={useSingleDriver ? 'default' : 'outline'} onClick={() => setUseSingleDriver(true)}>
            Driver único
          </Button>
          <Button variant={!useSingleDriver ? 'default' : 'outline'} onClick={() => setUseSingleDriver(false)}>
            Driver por zona
          </Button>
        </div>

        {useSingleDriver ? (
          <div className="mt-3 space-y-2">
            <Label>Driver</Label>
            <select
              className="w-full rounded-md border border-slate-200 p-2 text-sm"
              value={singleDriverId}
              onChange={(event) => setSingleDriverId(event.target.value)}
            >
              <option value="">Selecciona driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.full_name ?? driver.email ?? driver.id}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {[...groupedRows.keys()].map((groupKey) => (
              <div key={groupKey} className="rounded border border-slate-200 p-2">
                <p className="mb-1 text-sm font-medium">
                  {(zoneMap.get(groupKey)?.name ?? (groupedRows.get(groupKey)?.[0]?.zone_hint || 'Sin zona'))}
                </p>
                <select
                  className="w-full rounded-md border border-slate-200 p-2 text-sm"
                  value={driverByGroup[groupKey] ?? ''}
                  onChange={(event) =>
                    setDriverByGroup((prev) => ({ ...prev, [groupKey]: event.target.value }))
                  }
                >
                  <option value="">Selecciona driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name ?? driver.email ?? driver.id}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <Button
          className="mt-4 bg-orange-600 hover:bg-orange-700"
          onClick={createRoutes}
          disabled={isSaving || !validRows.length}
        >
          <Route className="mr-2 h-4 w-4" />Crear rutas y asignar
        </Button>
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Upload className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold">
            Preview: {validRows.length} válidas / {invalidRows.length} inválidas
          </h2>
        </div>

        {!rows.length ? <p className="text-sm text-slate-500">Sube un archivo para previsualizar.</p> : null}

        {!!rows.length ? (
          <div className="space-y-2">
            {rows.slice(0, 20).map((row, index) => (
              <div key={`${row.order_id || 'sin-id'}-${index}`} className="rounded border border-slate-200 p-2 text-sm">
                <p>
                  <strong>{row.order_id || 'Sin order_id'}</strong> · {row.customer_name || 'Sin cliente'} ·{' '}
                  {row.phone || 'Sin teléfono'} · {row.carrier || inferCarrierFromTracking(row.order_id)}
                </p>
                <p className="text-slate-600">{row.address_line1 || 'Dirección pendiente'}</p>
                <p className="text-xs text-slate-500">
                  Zona: {row.zone_id ? zoneMap.get(row.zone_id)?.name ?? row.zone_id : row.zone_hint || 'Sin zona'} ·{' '}
                  {row.zone_reason}
                </p>
                {!row.is_valid ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" />{row.errors.join(' · ')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      {result.length ? (
        <Card className="p-4">
          <h3 className="text-sm font-semibold">Resultado</h3>
          {result.map((item, index) => (
            <p key={`${item.group}-${index}`} className="text-sm text-slate-700">
              Grupo {item.group} · Driver {item.driver} · {item.shipments} pedidos · {item.routes} rutas
            </p>
          ))}
        </Card>
      ) : null}
    </div>
  );
}
