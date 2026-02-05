'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLoader } from '@/components/ui/loading-spinner';
import { getSupabaseClient, supabaseConfigError } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const completeAuthCallback = async () => {
      const fallbackNext = '/app';
      const nextPath = searchParams.get('next') || fallbackNext;

      if (supabaseConfigError) {
        router.replace(nextPath);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const code = searchParams.get('code');

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      } catch {
        // no-op: route will still continue to next
      } finally {
        router.replace(nextPath);
      }
    };

    completeAuthCallback();
  }, [router, searchParams]);

  return <PageLoader />;
}
