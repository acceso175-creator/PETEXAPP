'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Camera, Upload, MapPin, Check, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvidenceModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { photoUrl?: string; lat: number; lng: number }) => void;
  packageTracking: string;
  recipientName?: string;
}

export function EvidenceModal({
  open,
  onClose,
  onConfirm,
  packageTracking,
  recipientName,
}: EvidenceModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock location capture
  const captureLocation = () => {
    // TODO: Replace with actual Geolocation API
    // navigator.geolocation.getCurrentPosition(...)
    setLocation({
      lat: 28.6353 + (Math.random() - 0.5) * 0.01,
      lng: -106.0889 + (Math.random() - 0.5) * 0.01,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCapturing(true);
      // Mock upload - create data URL
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result as string);
        setIsCapturing(false);
        captureLocation();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (!location) {
      captureLocation();
    }
    onConfirm({
      photoUrl: photo || undefined,
      lat: location?.lat || 28.6353,
      lng: location?.lng || -106.0889,
    });
    resetState();
  };

  const resetState = () => {
    setPhoto(null);
    setLocation(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar entrega</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Package info */}
          <Card className="p-3 bg-slate-50">
            <p className="text-sm font-medium">{packageTracking}</p>
            {recipientName && (
              <p className="text-sm text-muted-foreground">{recipientName}</p>
            )}
          </Card>

          {/* Photo capture */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Foto de evidencia</p>

            {photo ? (
              <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                <img
                  src={photo}
                  alt="Evidencia"
                  className="w-full h-full object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => setPhoto(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  'aspect-video bg-slate-100 rounded-lg border-2 border-dashed border-slate-300',
                  'flex flex-col items-center justify-center gap-3 cursor-pointer',
                  'hover:bg-slate-50 transition-colors'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {isCapturing ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Camera className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">
                        Tomar foto o subir imagen
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click para seleccionar
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Ubicación</p>
            <Card className={cn(
              'p-3 flex items-center gap-2',
              location ? 'bg-green-50 border-green-200' : 'bg-slate-50'
            )}>
              <MapPin className={cn(
                'h-5 w-5',
                location ? 'text-green-600' : 'text-slate-400'
              )} />
              {location ? (
                <div className="text-sm">
                  <p className="font-medium text-green-700">Ubicación capturada</p>
                  <p className="text-xs text-slate-500">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Se capturará al confirmar
                </p>
              )}
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleConfirm}
          >
            <Check className="h-4 w-4 mr-1" />
            Confirmar entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
