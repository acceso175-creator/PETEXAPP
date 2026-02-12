'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/state';
import { toast } from 'sonner';

const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset, resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordError = useMemo(() => {
    if (!password) return '';
    if (password.length < MIN_PASSWORD) {
      return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
    }
    if (confirmPassword && password !== confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    return '';
  }, [password, confirmPassword]);

  const handleRequestReset = async () => {
    const response = await requestPasswordReset(email.trim().toLowerCase());
    if (response.success) {
      toast.success('Te enviamos instrucciones de recuperación (modo demo).');
    } else {
      toast.error(response.error || 'No se pudo procesar la solicitud.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < MIN_PASSWORD) {
      toast.error(`La contraseña debe tener mínimo ${MIN_PASSWORD} caracteres.`);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    const response = await resetPassword(email.trim().toLowerCase(), password);

    if (response.success) {
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
      router.push('/login');
    } else {
      toast.error(response.error || 'No fue posible actualizar la contraseña.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ingresa tu correo y establece una nueva contraseña.
        </p>

        <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleRequestReset} disabled={isLoading || !email}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Solicitar recuperación
          </Button>

          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordError ? <p className="text-xs text-red-600">{passwordError}</p> : null}
          </div>

          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading || !!passwordError}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar nueva contraseña
          </Button>

          <Button type="button" variant="link" className="w-full" onClick={() => router.push('/login')}>
            Volver al login
          </Button>
        </form>
      </Card>
    </div>
  );
}
