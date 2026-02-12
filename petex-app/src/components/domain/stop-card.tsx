'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Package,
  MapPin,
  Phone,
  User,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Camera,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stop, Package as PackageType } from '@/types';

interface StopCardProps {
  stop: Stop;
  pkg: PackageType;
  order: number;
  isFirst?: boolean;
  isLast?: boolean;
  onMarkDelivered?: () => void;
  onMarkFailed?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onViewProof?: () => void;
  onOpenEvidence?: () => void;
  isAdmin?: boolean;
  className?: string;
  isUpdating?: boolean;
}

export function StopCard({
  stop,
  pkg,
  order,
  isFirst,
  isLast,
  onMarkDelivered,
  onMarkFailed,
  onMoveUp,
  onMoveDown,
  onViewProof,
  onOpenEvidence,
  isAdmin,
  className,
  isUpdating,
}: StopCardProps) {
  const isCompleted = stop.status === 'delivered' || stop.status === 'failed';

  return (
    <Card className={cn(
      'p-4 transition-all',
      stop.status === 'delivered' && 'bg-green-50 border-green-200',
      stop.status === 'failed' && 'bg-red-50 border-red-200',
      className
    )}>
      <div className="flex gap-3">
        {/* Order Number */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
          stop.status === 'delivered' && 'bg-green-600 text-white',
          stop.status === 'failed' && 'bg-red-600 text-white',
          stop.status === 'pending' && 'bg-orange-500 text-white'
        )}>
          {stop.status === 'delivered' ? (
            <Check className="h-4 w-4" />
          ) : stop.status === 'failed' ? (
            <X className="h-4 w-4" />
          ) : (
            order
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-medium text-slate-700">
                  {pkg.tracking}
                </span>
                <StatusBadge status={stop.status} />
              </div>

              <div className="mt-2 space-y-1">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{pkg.addressNorm || pkg.addressRaw}</span>
                </div>

                {pkg.recipientName && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span>{pkg.recipientName}</span>
                  </div>
                )}

                {pkg.recipientPhone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <a href={`tel:${pkg.recipientPhone}`} className="text-orange-600 hover:underline">
                      {pkg.recipientPhone}
                    </a>
                  </div>
                )}

                {stop.deliveredAt && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      Entregado: {new Date(stop.deliveredAt).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {stop.failureReason && (
                  <p className="text-xs text-red-600 mt-1">
                    Motivo: {stop.failureReason}
                  </p>
                )}
              </div>
            </div>

            {/* Reorder buttons (admin) */}
            {isAdmin && stop.status === 'pending' && (
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={isFirst}
                  onClick={onMoveUp}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={isLast}
                  onClick={onMoveDown}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {!isCompleted && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                  onClick={onOpenEvidence || onMarkDelivered}
                  disabled={isUpdating}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Marcar entregado
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 sm:flex-none"
                  onClick={onMarkFailed}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4 mr-1" />
                  Marcar fallido
                </Button>
              </>
            )}

            {isCompleted && stop.status === 'delivered' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewProof}
              >
                <Camera className="h-4 w-4 mr-1" />
                Ver evidencia
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
