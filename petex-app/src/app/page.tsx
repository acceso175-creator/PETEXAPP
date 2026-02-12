// Root route fix: added page.tsx redirect
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/state';
import { PageLoader } from '@/components/ui/loading-spinner';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect based on role
        if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'driver') {
          router.push('/app');
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return <PageLoader />;
}
