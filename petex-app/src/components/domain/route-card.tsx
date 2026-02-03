'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Route as RouteIcon,
  MapPin,
  User,
  Clock,
  ChevronRight,
  Scissors,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Route, Zone, User as UserType } from '@/types';

interface RouteCardProps {
  route: Route;
  zone?: Zone;
  driver?: UserType;
  onView?: () => void;
  onAssign?: () => void;
  onDivide?: () => void;
  className?: string;
}

export function RouteCard({
  route,
  zone,
  driver,
  onView,
  onAssign,
  onDivide,
  className,
}: RouteCardProps) {
  return (
    <Card className={cn('p-4 hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start gap-3">
        {/* Route Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: zone?.color ? `${zone.color}20` : '#f1f5f9' }}
        >
          <RouteIcon
            className="h-5 w-5"
            style={{ color: zone?.color || '#64748b' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 line-clamp-1">
                {route.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <StatusBadge status={route.status} />
                {zone && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${zone.color}20`,
                      color: zone.color
                    }}
                  >
                    {zone.name}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={onView}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{route.completedStops}/{route.totalStops} paradas</span>
            </div>
            {route.estimatedTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{route.estimatedTime}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Progreso</span>
              <span className="font-medium">{route.progressPct}%</span>
            </div>
            <Progress
              value={route.progressPct}
              className="h-2"
            />
          </div>

          {/* Driver or assign */}
          <div className="mt-3 flex items-center justify-between">
            {driver ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                    {driver.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-700">{driver.name}</span>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={onAssign}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Asignar driver
              </Button>
            )}

            {route.status !== 'done' && route.totalStops > 2 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-500"
                onClick={onDivide}
              >
                <Scissors className="h-4 w-4 mr-1" />
                Dividir
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
