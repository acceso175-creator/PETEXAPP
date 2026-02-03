'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Route,
  ScanLine,
  AlertTriangle,
  Inbox,
  Package,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '@/state';

const navItems = [
  { href: '/app', label: 'Inicio', icon: Home },
  { href: '/app/route', label: 'Mi Ruta', icon: Route },
  { href: '/app/scan', label: 'Escanear', icon: ScanLine, highlight: true },
  { href: '/app/issues', label: 'Reportar', icon: AlertTriangle },
  { href: '/app/inbox', label: 'Mensajes', icon: Inbox },
];

export function DriverNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <Link href="/app" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900">PETEX</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-orange-100 text-orange-700 text-sm">
                  {user?.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-500">Driver</p>
            </div>
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main content */}
      <main className="pt-14">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-40 safe-area-pb">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]',
                isActive
                  ? 'text-orange-600'
                  : 'text-slate-500 hover:text-slate-700',
                item.highlight && !isActive && 'relative'
              )}
            >
              {item.highlight ? (
                <div className={cn(
                  'absolute -top-6 p-3 rounded-full shadow-lg',
                  isActive ? 'bg-orange-600' : 'bg-orange-500'
                )}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
              ) : (
                <item.icon className={cn(
                  'h-5 w-5',
                  isActive && 'text-orange-600'
                )} />
              )}
              <span className={cn(
                'text-xs font-medium',
                item.highlight && 'mt-4'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
