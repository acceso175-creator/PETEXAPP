'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/state';
import { PageLoader } from '@/components/ui/loading-spinner';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const getHomeByRole = (role?: UserRole) => {
  if (role === 'admin') return '/admin';
  if (role === 'driver') return '/app';
  return '/login';
};

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useAuth();

  const roleAllowed = user?.role
    ? requiredRole
      ? user.role === requiredRole
      : allowedRoles
        ? allowedRoles.includes(user.role)
        : true
    : false;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push(redirectTo);
        return;
      }

      if (!roleAllowed) {
        router.push(getHomeByRole(user.role));
      }
    }
  }, [isLoading, isAuthenticated, user, roleAllowed, redirectTo, router]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user || !roleAllowed) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
