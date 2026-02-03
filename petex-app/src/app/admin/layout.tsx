// Root route fix: added admin layout.tsx
import { ProtectedRoute } from '@/components/layout/protected-route';
import { AdminSidebar } from '@/components/layout/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminSidebar>{children}</AdminSidebar>
    </ProtectedRoute>
  );
}
