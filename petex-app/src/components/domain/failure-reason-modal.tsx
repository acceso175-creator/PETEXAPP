'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FailureReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  packageTracking: string;
  recipientName?: string;
  isSubmitting?: boolean;
}

const failureReasons = [
  'Destinatario ausente',
  'Dirección incorrecta',
  'No se localiza domicilio',
  'Sin acceso',
  'Paquete dañado',
  'Otro',
];

export function FailureReasonModal({
  open,
  onClose,
  onConfirm,
  packageTracking,
  recipientName,
  isSubmitting,
}: FailureReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  const finalReason = useMemo(() => {
    if (selectedReason === 'Otro') {
      return customReason.trim();
    }
    return selectedReason;
  }, [selectedReason, customReason]);

  const handleConfirm = () => {
    if (!finalReason) return;
    onConfirm(finalReason);
    setSelectedReason('');
    setCustomReason('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar entrega fallida</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-3 bg-slate-50">
            <p className="text-sm font-medium">{packageTracking}</p>
            {recipientName && (
              <p className="text-sm text-muted-foreground">{recipientName}</p>
            )}
          </Card>

          <div className="space-y-2">
            <p className="text-sm font-medium">Motivo</p>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {failureReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason === 'Otro' && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Describe el motivo</p>
              <Textarea
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Escribe el motivo"
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!finalReason || isSubmitting}
          >
            Confirmar fallo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
