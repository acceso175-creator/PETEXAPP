'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Send, X } from 'lucide-react';
import type { IssueType, IssueScope } from '@/types';

interface IssueFormProps {
  scope?: IssueScope;
  scopeId?: string;
  onSubmit: (data: {
    scope: IssueScope;
    scopeId?: string;
    type: IssueType;
    note: string;
    photoUrl?: string;
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const issueTypes: { value: IssueType; label: string }[] = [
  { value: 'wrong_address', label: 'Dirección incorrecta' },
  { value: 'no_access', label: 'Sin acceso al lugar' },
  { value: 'damaged', label: 'Paquete dañado' },
  { value: 'recipient_absent', label: 'Destinatario ausente' },
  { value: 'other', label: 'Otro' },
];

export function IssueForm({
  scope = 'general',
  scopeId,
  onSubmit,
  onCancel,
  isLoading,
}: IssueFormProps) {
  const [type, setType] = useState<IssueType | ''>('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !note.trim()) return;

    onSubmit({
      scope,
      scopeId,
      type,
      note: note.trim(),
      photoUrl: photo || undefined,
    });
  };

  const isValid = type && note.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Issue Type */}
      <div className="space-y-2">
        <Label htmlFor="issue-type">Tipo de problema</Label>
        <Select
          value={type}
          onValueChange={(v) => setType(v as IssueType)}
        >
          <SelectTrigger id="issue-type">
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            {issueTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="issue-note">Descripción</Label>
        <textarea
          id="issue-note"
          className="w-full min-h-[100px] p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Describe el problema..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Photo */}
      <div className="space-y-2">
        <Label>Foto (opcional)</Label>
        {photo ? (
          <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden">
            <img
              src={photo}
              alt="Foto del problema"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => setPhoto(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Card
            className="p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-500">Agregar foto</span>
          </Card>
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

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 bg-orange-600 hover:bg-orange-700"
          disabled={!isValid || isLoading}
        >
          <Send className="h-4 w-4 mr-1" />
          {isLoading ? 'Enviando...' : 'Reportar'}
        </Button>
      </div>
    </form>
  );
}
