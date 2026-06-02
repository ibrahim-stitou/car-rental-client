'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import { IconCalendarPlus, IconAlertTriangle } from '@tabler/icons-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  reservationRef: string;
  currentReturnDate?: string;
  status: string;
  onSuccess?: () => void;
}

function toDatetimeLocal(iso: string | undefined | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

export function ExtendReservationDialog({
  open, onOpenChange, reservationId, reservationRef, currentReturnDate, status, onSuccess,
}: Props) {
  const [newReturnDate, setNewReturnDate] = useState('');
  const [additionalFees, setAdditionalFees] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const minDate = currentReturnDate ? toDatetimeLocal(currentReturnDate) : '';

  const handleExtend = async () => {
    if (!newReturnDate) {
      toast.error('Veuillez saisir la nouvelle date de retour');
      return;
    }
    setLoading(true);
    try {
      await apiClient.patch(apiRoutes.reservationsExt.extend(reservationId), {
        new_return_date: newReturnDate,
        additional_fees: additionalFees ? Number(additionalFees) : undefined,
        notes: notes || undefined,
      });
      toast.success(`Réservation ${reservationRef} prolongée`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la prolongation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconCalendarPlus className="h-5 w-5 text-blue-600" />
            Prolonger la réservation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            Réservation <span className="font-mono font-medium text-foreground">{reservationRef}</span>
          </div>

          {status === 'active' && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800 text-xs">
                La réservation est en cours. Un nouveau contrat sera généré pour la période de prolongation.
              </AlertDescription>
            </Alert>
          )}

          {currentReturnDate && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Date de retour actuelle : </span>
              <span className="font-semibold">{new Date(currentReturnDate).toLocaleString('fr-MA', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-return-date">Nouvelle date & heure de retour *</Label>
            <Input
              id="new-return-date"
              type="datetime-local"
              min={minDate}
              value={newReturnDate}
              onChange={e => setNewReturnDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extra-fees">Frais supplémentaires (MAD)</Label>
            <Input
              id="extra-fees"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={additionalFees}
              onChange={e => setAdditionalFees(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ext-notes">Notes</Label>
            <Textarea
              id="ext-notes"
              placeholder="Raison de la prolongation…"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Annuler</Button>
          <Button onClick={handleExtend} disabled={loading || !newReturnDate}>
            {loading ? 'Prolongation…' : 'Confirmer la prolongation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
