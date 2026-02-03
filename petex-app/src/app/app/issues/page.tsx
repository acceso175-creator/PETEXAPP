// Driver issues page
'use client';

import { useState } from 'react';
import { useAuth } from '@/state';
import { IssueForm } from '@/components/domain/issue-form';
import { Card } from '@/components/ui/card';
import { createIssue } from '@/services/issues.service';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

export default function DriverIssuesPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (data: {
    scope: Parameters<typeof createIssue>[0]['scope'];
    scopeId?: string;
    type: Parameters<typeof createIssue>[0]['type'];
    note: string;
    photoUrl?: string;
  }) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await createIssue({
        ...data,
        reportedBy: user.id,
      });
      toast.success('Problema reportado correctamente');
      setSubmitted(true);
    } catch (error) {
      toast.error('Error al reportar problema');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-lg font-medium text-slate-900 mb-2">
            Reporte enviado
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            Tu reporte ha sido enviado al equipo de soporte.
          </p>
          <button
            type="button"
            className="text-orange-600 font-medium"
            onClick={() => setSubmitted(false)}
          >
            Reportar otro problema
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Reportar Problema</h1>
      <Card className="p-4">
        <IssueForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
}
