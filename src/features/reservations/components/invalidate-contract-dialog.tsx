'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  reservationRef: string;
  onSuccess?: () => void;
}

export function InvalidateContractDialog({ open, onOpenChange, reservationId, reservationRef, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (reason.trim().length < 5) {
      toast.error('Le motif doit comporter au moins 5 caractères');
      return;
    }
    setLoading(true);
    try {
      await apiClient.patch(apiRoutes.reservationsExt.invalidateContract(reservationId), { reason: reason.trim() });
      toast.success('Contrat dévalidé — pensez à le régénérer avant impression');
      setReason('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Impossible de dévalider le contrat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setReason(''); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Dévalider le contrat
          </DialogTitle>
          <DialogDescription>
            Le contrat de la réservation <strong className="font-mono">{reservationRef}</strong> sera marqué obsolète.
            Il restera consultable mais devra être régénéré avant d'être remis au client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="invalidate-reason" className="text-sm font-medium">
            Motif de dévalidation <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="invalidate-reason"
            placeholder="Expliquez pourquoi ce contrat doit être révisé…"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">{reason.length} / 500 caractères (min. 5)</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Annuler</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading || reason.trim().length < 5}>
            {loading ? 'Dévalidation…' : 'Confirmer la dévalidation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
