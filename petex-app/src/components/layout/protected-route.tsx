'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/state';
import { PageLoader } from '@/components/ui/loading-spinner';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated, isAuthorized, user } = useRequireAuth(requiredRole);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
      } else if (requiredRole && !isAuthorized) {
        // Redirect to appropriate dashboard based on role
        if (user?.role === 'admin') {
          router.push('/admin');
        } else if (user?.role === 'driver') {
          router.push('/app');
        } else {
          router.push(redirectTo);
        }
      }
    }
  }, [isLoading, isAuthenticated, isAuthorized, requiredRole, redirectTo, router, user]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || (requiredRole && !isAuthorized)) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
