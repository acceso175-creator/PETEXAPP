"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Phone, Mail, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/types';
import { toggleUserActive } from '@/services/users.service';

interface AdminUsersClientProps {
  initialUsers: User[];
}

export default function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);

  const handleToggleActive = async (userId: string) => {
    const updated = await toggleUserActive(userId);
    if (updated) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updated : u))
      );
    }
  };

  const admins = users.filter((u) => u.role === 'admin');
  const drivers = users.filter((u) => u.role === 'driver');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-slate-500">Gestión de administradores y drivers</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Administradores</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {admins.map((user) => (
            <UserCard key={user.id} user={user} onToggleActive={handleToggleActive} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Drivers</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((user) => (
            <UserCard key={user.id} user={user} onToggleActive={handleToggleActive} />
          ))}
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, onToggleActive }: { user: User; onToggleActive: (id: string) => void }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-orange-100 text-orange-700">
            {user.name.split(' ').map((n) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{user.name}</span>
            <Badge variant={user.active ? 'default' : 'secondary'} className={user.active ? 'bg-green-600' : ''}>
              {user.active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <div className="mt-2 space-y-1 text-sm text-slate-500">
            {user.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggleActive(user.id)}>
              {user.active ? 'Desactivar' : 'Activar'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
