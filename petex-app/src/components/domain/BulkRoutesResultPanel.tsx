import { AlertTriangle, CheckCircle2, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { buildCsv, buildTimestampedFilename, downloadCsvFile } from '@/lib/helpers/csv';

export type CreatedRouteResult = { group: string; driver: string; shipments: number; routes: number };
export type InvalidRow = { row_number: number; reason: string };
export type BulkRoutesSummary = { routes_created: number; deliveries_imported: number; invalid_rows: number };

export type BulkRoutesResultData = {
  summary?: Partial<BulkRoutesSummary>;
  groups?: CreatedRouteResult[];
  invalid_rows?: InvalidRow[];
};

type Props = {
  result: BulkRoutesResultData | null;
  errorMessage?: string | null;
};

const hasMissingDriverReason = (invalidRows: InvalidRow[]) =>
  invalidRows.some((row) => /falta driver para grupo/i.test(row.reason));

export function BulkRoutesResultPanel({ result, errorMessage }: Props) {
  if (!result && !errorMessage) return null;

  const summary = {
    routes_created: result?.summary?.routes_created ?? 0,
    deliveries_imported: result?.summary?.deliveries_imported ?? 0,
    invalid_rows: result?.summary?.invalid_rows ?? result?.invalid_rows?.length ?? 0,
  };

  const groups = result?.groups ?? [];
  const invalidRows = result?.invalid_rows ?? [];

  const handleDownloadInvalidRows = () => {
    const csv = buildCsv(
      ['row_number', 'reason'],
      invalidRows.map((row) => [row.row_number, row.reason])
    );
    const filename = buildTimestampedFilename('invalid_rows', 'csv');
    downloadCsvFile(csv, filename);
  };

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Resultados de importación</h3>
        <p className="text-xs text-slate-500">Resumen detallado del último intento de ruteo masivo.</p>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" /> Error al crear rutas
          </p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Rutas creadas</p>
          <p className="text-lg font-semibold text-slate-900">{summary.routes_created}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Importados</p>
          <p className="text-lg font-semibold text-slate-900">{summary.deliveries_imported}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Inválidos</p>
          <p className="text-lg font-semibold text-slate-900">{summary.invalid_rows}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900">Filas inválidas</h4>
          {invalidRows.length ? (
            <Button size="sm" variant="outline" onClick={handleDownloadInvalidRows}>
              <Download className="mr-2 h-4 w-4" /> Descargar inválidos (CSV)
            </Button>
          ) : null}
        </div>

        {invalidRows.length ? (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {invalidRows.map((invalidRow, index) => (
                  <tr key={`${invalidRow.row_number}-${index}`} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-medium text-slate-700">
                      {invalidRow.row_number === 0 ? '(general)' : invalidRow.row_number}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{invalidRow.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-emerald-700">Sin inválidos ✅</p>
        )}

        {invalidRows.length ? (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
            <p className="flex items-center gap-2 font-medium">
              <Info className="h-4 w-4" /> Ayuda para corregir
            </p>
            <p className="mt-1">Cada fila inválida requiere: order_id + address_line1 + (phone o customer_name).</p>
            {hasMissingDriverReason(invalidRows) ? (
              <p className="mt-1">Asigna driver a ese grupo o usa “Driver único”.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {groups.length ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Grupos creados</h4>
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Grupo</th>
                  <th className="px-3 py-2">Driver</th>
                  <th className="px-3 py-2">Pedidos</th>
                  <th className="px-3 py-2">Rutas</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((item, index) => (
                  <tr key={`${item.group}-${index}`} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-medium text-slate-700">{item.group}</td>
                    <td className="px-3 py-2 text-slate-600">{item.driver}</td>
                    <td className="px-3 py-2 text-slate-600">{item.shipments}</td>
                    <td className="px-3 py-2 text-slate-600">{item.routes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-slate-400" /> Aún no hay grupos creados en este intento.
        </p>
      )}
    </Card>
  );
}
