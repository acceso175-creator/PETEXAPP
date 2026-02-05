import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/loading-spinner';
import CallbackClient from './CallbackClient';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CallbackClient />
    </Suspense>
  );
}
