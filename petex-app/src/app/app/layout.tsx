// Root route fix: added driver app layout.tsx
import { ProtectedRoute } from '@/components/layout/protected-route';
import { DriverNav } from '@/components/layout/driver-nav';

export default function DriverAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="driver">
      <DriverNav>{children}</DriverNav>
    </ProtectedRoute>
  );
}
