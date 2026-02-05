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
import { Package, Loader2, CheckCircle2, Clock3 } from 'lucide-react';
import { useAuth } from '@/state';
import { toast } from 'sonner';

type ChangelogItem = {
  date: string;
  title: string;
  highlights: string[];
};

const MIN_PASSWORD = 8;

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPhone, signup, quickLogin, isLoading, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [changelog, setChangelog] = useState<ChangelogItem[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/app');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    let isMounted = true;

    import('@/content/changelog.json')
      .then((mod) => {
        if (!isMounted) return;
        const data = (mod.default ?? []) as ChangelogItem[];
        const sortedData = [...data].sort((a, b) => b.date.localeCompare(a.date));
        setChangelog(sortedData);
      })
      .catch(() => {
        if (!isMounted) return;
        setChangelog([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setNotesLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const latestItem = useMemo(() => changelog[0] ?? null, [changelog]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email.trim().toLowerCase(), password);
    if (result.success) {
      toast.success('Sesión iniciada');
      router.push('/app');
    } else {
      toast.error(result.error || 'Error al iniciar sesión. Intenta de nuevo.');
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginWithPhone(phone.trim(), password);
    if (result.success) {
      toast.success('Sesión iniciada');
      router.push('/app');
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
    if (result.success) {
      toast.success('Cuenta creada correctamente');
      router.push('/app');
    } else {
      toast.error(result.error || 'No fue posible crear la cuenta');
    }
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

          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-center text-xs text-slate-500">
              <strong>Demo:</strong> carlos@petex.mx / admin123
            </p>
          </div>
        </Card>

        <Card className="h-fit p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Resumen de actualización</p>
              <p className="text-xs text-slate-500">Codex Summary</p>
            </div>
            <Clock3 className="h-4 w-4 text-orange-600" />
          </div>

          <div className="mt-4">
            <p className="text-base font-semibold text-slate-900">{latestItem?.title ?? 'Sin datos recientes'}</p>
            <p className="text-xs text-slate-500">
              {latestItem?.date
                ? new Date(latestItem.date).toLocaleDateString('es-MX', { dateStyle: 'long' })
                : 'Fecha no disponible'}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {latestItem?.highlights?.length ? (
              latestItem.highlights.map((highlight) => (
                <div key={highlight} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-orange-600" />
                  <span>{highlight}</span>
                </div>
              ))
            ) : notesLoaded ? (
              <p className="text-sm text-slate-500">Sin actualizaciones recientes.</p>
            ) : (
              <p className="text-sm text-slate-400">Cargando resumen...</p>
            )}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-5 w-full">Ver historial</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Historial de actualizaciones</DialogTitle>
                <DialogDescription>Últimos cambios aplicados al acceso y seguridad.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {changelog.slice(0, 10).map((item) => (
                  <Card key={`${item.date}-${item.title}`} className="border p-4">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.date).toLocaleDateString('es-MX', { dateStyle: 'long' })}
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {item.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </div>
  );
}
