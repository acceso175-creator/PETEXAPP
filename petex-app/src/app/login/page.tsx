// Root route fix: added login page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Loader2 } from 'lucide-react';
import { useAuth } from '@/state';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPhone, quickLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      toast.success('Sesión iniciada');
      router.push('/');
    } else {
      toast.error(result.error || 'Error al iniciar sesión');
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginWithPhone(phone, password);
    if (result.success) {
      toast.success('Sesión iniciada');
      router.push('/');
    } else {
      toast.error(result.error || 'Error al iniciar sesión');
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'driver') => {
    const result = await quickLogin(role);
    if (result.success) {
      toast.success('Sesión iniciada');
      router.push('/');
    } else {
      toast.error(result.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-orange-600 flex items-center justify-center mb-3">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">PETEX</h1>
          <p className="text-sm text-slate-500 mt-1">Control de Última Milla</p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Teléfono</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
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
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Iniciar sesión
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
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Iniciar sesión
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Demo Quick Login */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-center text-slate-500 mb-3">
            Acceso rápido para demo
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleQuickLogin('admin')}
              disabled={isLoading}
            >
              Admin Demo
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleQuickLogin('driver')}
              disabled={isLoading}
            >
              Driver Demo
            </Button>
          </div>
        </div>

        {/* Credentials hint */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 text-center">
            <strong>Demo:</strong> carlos@petex.mx / admin123
          </p>
        </div>
      </Card>
    </div>
  );
}
