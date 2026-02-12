import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  // Package statuses
  created: { label: 'Creado', variant: 'outline', className: 'border-slate-400 text-slate-600' },
  assigned: { label: 'Asignado', variant: 'secondary', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  delivering: { label: 'En camino', variant: 'default', className: 'bg-amber-500 hover:bg-amber-500' },
  delivered: { label: 'Entregado', variant: 'default', className: 'bg-green-600 hover:bg-green-600' },
  failed: { label: 'Fallido', variant: 'destructive', className: '' },

  // Route statuses
  draft: { label: 'Borrador', variant: 'outline', className: 'border-slate-400 text-slate-600' },
  active: { label: 'Activa', variant: 'default', className: 'bg-green-600 hover:bg-green-600' },
  done: { label: 'Completada', variant: 'secondary', className: 'bg-slate-200 text-slate-700 hover:bg-slate-200' },

  // Stop statuses
  pending: { label: 'Pendiente', variant: 'outline', className: 'border-amber-400 text-amber-600' },
  pendiente: { label: 'Pendiente', variant: 'outline', className: 'border-amber-400 text-amber-600' },
  entregado: { label: 'Entregado', variant: 'default', className: 'bg-green-600 hover:bg-green-600' },
  fallido: { label: 'Fallido', variant: 'destructive', className: '' },

  // Issue statuses
  open: { label: 'Abierto', variant: 'destructive', className: '' },
  in_progress: { label: 'En proceso', variant: 'default', className: 'bg-amber-500 hover:bg-amber-500' },
  closed: { label: 'Cerrado', variant: 'secondary', className: 'bg-slate-200 text-slate-700 hover:bg-slate-200' },

  // Message statuses
  queued: { label: 'En cola', variant: 'outline', className: 'border-slate-400 text-slate-600' },
  sent: { label: 'Enviado', variant: 'secondary', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  read: { label: 'Leído', variant: 'default', className: 'bg-green-600 hover:bg-green-600' },

  // Priority
  low: { label: 'Baja', variant: 'outline', className: 'border-slate-300 text-slate-500' },
  normal: { label: 'Normal', variant: 'secondary', className: 'bg-slate-100 text-slate-600 hover:bg-slate-100' },
  high: { label: 'Alta', variant: 'destructive', className: '' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const, className: '' };

  return (
    <Badge
      variant={config.variant}
      className={cn('font-medium text-xs', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
