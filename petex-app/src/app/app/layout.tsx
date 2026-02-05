import { ProtectedRoute } from '@/components/layout/protected-route';
import { DriverNav } from '@/components/layout/driver-nav';

export default function DriverAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['driver', 'admin']}>
      <DriverNav>{children}</DriverNav>
    </ProtectedRoute>
  );
}
