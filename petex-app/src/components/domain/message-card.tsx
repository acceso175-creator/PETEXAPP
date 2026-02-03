'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { TaskMessage, User } from '@/types';

interface MessageCardProps {
  message: TaskMessage;
  sender?: User;
  onClick?: () => void;
  className?: string;
}

const priorityColors = {
  low: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-red-100 text-red-600',
};

export function MessageCard({ message, sender, onClick, className }: MessageCardProps) {
  const isUnread = message.status !== 'read';

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer hover:shadow-md transition-all',
        isUnread && 'border-l-4 border-l-orange-500 bg-orange-50/30',
        className
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-orange-100 text-orange-700 text-sm">
            {sender?.name.split(' ').map(n => n[0]).join('') || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'font-medium text-sm',
                  isUnread && 'font-semibold'
                )}>
                  {sender?.name || 'Usuario'}
                </span>
                {message.priority !== 'normal' && (
                  <Badge
                    variant="secondary"
                    className={cn('text-xs', priorityColors[message.priority])}
                  >
                    {message.priority === 'high' ? 'Urgente' : 'Baja'}
                  </Badge>
                )}
              </div>
              {message.subject && (
                <p className={cn(
                  'text-sm mt-0.5',
                  isUnread ? 'text-slate-900 font-medium' : 'text-slate-700'
                )}>
                  {message.subject}
                </p>
              )}
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">
              {formatTimeAgo(message.createdAt)}
            </span>
          </div>

          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
            {message.text}
          </p>
        </div>
      </div>
    </Card>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}
