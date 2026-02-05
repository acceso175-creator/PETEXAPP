'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getSupabaseClient, supabaseConfigError } from '@/lib/supabase/client';
import type { UserRole } from '@/types';

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
};

const roleOptions: UserRole[] = ['admin', 'driver', 'ops'];

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [changingId, setChangingId] = useState<string | null>(null);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      if (supabaseConfigError) {
        toast.error('Supabase no está configurado en este entorno.');
        setProfiles([]);
        return;
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,role')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles((data ?? []) as Profile[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleRoleChange = async (profileId: string, newRole: UserRole) => {
    if (supabaseConfigError) {
      toast.error('Falta configuración de Supabase para cambiar roles.');
      return;
    }

    setChangingId(profileId);
    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast.error('Tu sesión expiró. Inicia sesión nuevamente.');
        return;
      }

      const response = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: profileId, role: newRole }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo actualizar el rol');
      }

      toast.success('Rol actualizado correctamente');
      await loadProfiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar el rol');
    } finally {
      setChangingId(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando perfiles..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-slate-500">Administra roles de acceso de forma segura.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-800">{profile.email ?? 'Sin correo'}</td>
                  <td className="px-4 py-3 text-slate-700">{profile.full_name ?? 'Sin nombre'}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={profile.role}
                      onValueChange={(value) => handleRoleChange(profile.id, value as UserRole)}
                      disabled={changingId === profile.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role} className="capitalize">
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!profiles.length ? (
            <p className="p-4 text-sm text-slate-500">No hay perfiles para mostrar.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
