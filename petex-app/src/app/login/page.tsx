'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Package, Loader2, CheckCircle2, Clock3, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/state';
import { toast } from 'sonner';
import { getSupabaseHealthCheck, type SupabaseHealthCheck } from '@/services/auth.service';

type ChangelogItem = {
  date: string;
  title: string;
  highlights: string[];
};

const MIN_PASSWORD = 8;
const getDashboardByRole = (role: 'admin' | 'driver' | 'ops' | undefined) => {
  if (role === 'admin') return '/admin';
  if (role === 'ops') return '/admin';
  return '/app';
};

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPhone, signup, quickLogin, isLoading, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const buildId = process.env.NEXT_PUBLIC_APP_BUILD_ID || 'local';
  const buildContext = process.env.NEXT_PUBLIC_NETLIFY_CONTEXT || 'local';
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || 'local';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email.trim().toLowerCase(), password);
    if (result.success) {
      toast.success('Sesión iniciada');
      router.push(getDashboardByRole(result.user?.role));
    } else {
      toast.error(result.error || 'Error al iniciar sesión. Intenta de nuevo.');
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginWithPhone(phone.trim(), password);
    if (result.success) {
      toast.success('Sesión iniciada');
      router.push(getDashboardByRole(result.user?.role));
    } else {
      toast.error(result.error || 'Error al iniciar sesión. Revisa tus datos.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword.length < MIN_PASSWORD) {
      toast.error(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
      return;
    }

    const result = await signup(signupName, signupEmail, signupPassword);
    if (!result.success) {
      toast.error(result.error || 'No fue posible crear la cuenta');
      return;
    }

    if (result.requiresEmailConfirmation) {
      toast.success(result.error || 'Cuenta creada. Revisa tu correo para confirmar.');
      return;
    }

    if (!result.user) {
      toast.success(result.error || 'Cuenta creada. Ya puedes iniciar sesión.');
      return;
    }

    toast.success('Cuenta creada correctamente');
    router.push(getDashboardByRole(result.user.role));
  };

  const handleQuickLogin = async (role: 'admin' | 'driver') => {
    const result = await quickLogin(role);
    if (result.success) {
      toast.success('Sesión iniciada');
      router.push(role === 'admin' ? '/admin' : '/app');
    } else {
      toast.error(result.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-slate-100 p-4">
      <div className="mx-auto grid w-full max-w-5xl gap-4 pt-4 sm:pt-8 lg:grid-cols-2">
        <Card className="p-6 sm:p-8">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-600">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">PETEX</h1>
            <p className="mt-1 text-sm text-slate-500">Control de Última Milla</p>
          </div>

          {process.env.NODE_ENV !== 'production' && health ? (
            <Card className="mb-4 border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Supabase health-check (dev)</p>
                  <p className="text-[11px] text-slate-500">project-ref: {health.projectRef ?? 'N/D'}</p>
                  <p className="mt-1 text-[11px] text-slate-500">URL: {health.url ?? 'N/D'}</p>
                  <p className="mt-1 text-[11px] text-slate-600">{health.message}</p>
                </div>
                {health.connectionOk ? (
                  <Wifi className="h-4 w-4 text-emerald-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
              </div>
            </Card>
          ) : null}

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="signin">Ingresar</TabsTrigger>
              <TabsTrigger value="phone">Teléfono</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Iniciar sesión
                </Button>
                <Button type="button" variant="link" className="w-full" onClick={() => router.push('/reset-password')}>
                  Olvidé mi contraseña
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+52 614 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-phone">Contraseña</Label>
                  <Input
                    id="password-phone"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Iniciar sesión
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nombre</Label>
                  <Input
                    id="signup-name"
                    placeholder="Nombre completo"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Correo electrónico</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="nuevo@petex.mx"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Crear cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="mb-3 text-center text-xs text-slate-500">Acceso rápido para demo</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleQuickLogin('admin')} disabled={isLoading}>
                Admin Demo
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleQuickLogin('driver')} disabled={isLoading}>
                Driver Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Credentials hint */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 text-center">
            <strong>Demo:</strong> carlos@petex.mx / admin123
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-700">
            Resumen de actualización
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-slate-500">
            <li>Marcador de build automático en Netlify.</li>
            <li>
              Se corrigió carga de perfiles/rutas usando sesión SSR (evita listas
              vacías por RLS).
            </li>
            <li>
              Se corrigió compatibilidad de cookies SSR en Next 15 para evitar
              fallos de build.
            </li>
          </ul>
        </div>

        <footer className="mt-6 text-center text-[11px] text-slate-400">
          <span className="font-medium">Build:</span> {buildId} |{' '}
          {buildContext} | {buildTime}
        </footer>
      </Card>
    </div>
  );
}
