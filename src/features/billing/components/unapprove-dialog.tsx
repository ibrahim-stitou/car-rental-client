'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUnapproveBillingDocument } from '../hooks/use-billing';
import type { BillingDocument } from '@/types/billing.types';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  document: BillingDocument;
  onSuccess?: () => void;
}

export function UnapproveDialog({ open, onOpenChange, document, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const mutation = useUnapproveBillingDocument();

  const handleSubmit = () => {
    if (reason.trim().length < 5) {
      toast.error('Le motif doit comporter au moins 5 caractères');
      return;
    }
    mutation.mutate(
      { id: document.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Document dévalidé — statut remis en brouillon');
          setReason('');
          onOpenChange(false);
          onSuccess?.();
        },
        onError: () => toast.error('Impossible de dévalider le document'),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setReason(''); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Dévalider le document
          </DialogTitle>
          <DialogDescription>
            Le document <strong className="font-mono">{document.document_number}</strong> sera remis en brouillon.
            Sa référence définitive sera réinitialisée et une nouvelle sera attribuée lors de la prochaine validation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="reason" className="text-sm font-medium">
            Motif de dévalidation <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="Expliquez pourquoi ce document est dévalidé…"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">{reason.length} / 500 caractères (min. 5)</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={mutation.isPending || reason.trim().length < 5}
          >
            {mutation.isPending ? 'Dévalidation…' : 'Confirmer la dévalidation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
