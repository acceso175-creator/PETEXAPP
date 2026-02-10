'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noSession, setNoSession] = useState(false);

  const getAccessToken = useCallback(async () => {
    if (supabaseConfigError) {
      throw new Error('Supabase no está configurado en este entorno.');
    }

    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setNoSession(true);
      return null;
    }

    setNoSession(false);
    return accessToken;
  }, []);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setProfiles([]);
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json()) as { users?: Profile[]; error?: string };
      if (!response.ok) {
        throw new Error(`${response.status}: ${payload.error || 'No se pudieron cargar los usuarios'}`);
      }

      setProfiles(payload.users ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los usuarios';
      setErrorMessage(message);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleRoleChange = async (profileId: string, newRole: UserRole) => {
    setChangingId(profileId);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        toast.error('No hay sesión activa. Vuelve a iniciar sesión.');
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

  if (noSession) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">No hay sesión activa.</p>
          <p className="mt-1 text-xs text-amber-700">
            Inicia sesión con una cuenta admin para gestionar usuarios.
          </p>
          <Button className="mt-3" onClick={() => router.push('/login')}>
            Ir a login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-slate-500">Administra roles de acceso de forma segura.</p>
      </div>

      {errorMessage ? (
        <Card className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error al cargar usuarios: {errorMessage}
        </Card>
      ) : null}

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
                  <td className="px-4 py-3 text-slate-800">{profile.email ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{profile.full_name ?? '—'}</td>
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
