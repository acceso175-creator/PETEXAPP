// Driver scan page
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanLine, Package, Search } from 'lucide-react';

export default function DriverScanPage() {
  const [tracking, setTracking] = useState('');

  const handleScan = () => {
    // TODO: Implement camera scanning
    alert('Funcionalidad de cámara pendiente');
  };

  const handleSearch = () => {
    if (tracking) {
      alert(`Buscando: ${tracking}`);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Escanear Paquete</h1>

      {/* Scan Area */}
      <Card
        className="aspect-square max-w-sm mx-auto mb-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={handleScan}
      >
        <div className="p-6 bg-orange-100 rounded-full mb-4">
          <ScanLine className="h-12 w-12 text-orange-600" />
        </div>
        <p className="text-lg font-medium text-slate-700">Toca para escanear</p>
        <p className="text-sm text-slate-500 mt-1">
          Apunta la cámara al código de barras
        </p>
      </Card>

      {/* Manual Input */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-500 text-center">
          O ingresa manualmente
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Número de guía..."
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
