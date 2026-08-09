'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import {
  IconCalendarPlus, IconAlertTriangle, IconArrowRight, IconCalculator,
  IconClock, IconReceipt2,
} from '@tabler/icons-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  reservationRef: string;
  currentReturnDate?: string;
  pickupDate?: string;
  dailyRate?: number;
  discountPercentage?: number;
  existingAdditionalFees?: number;
  currentTotalAmount?: number;
  contractStatus?: string;
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

function fmtMoney(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(d: Date) {
  return d.toLocaleString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Mirrors Reservation::calculateTotal() on the backend (ceil of whole days
// between pickup and return, minimum 1) so the preview shown here matches
// exactly what the server will persist.
function daysBetween(pickup: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - pickup.getTime()) / 86400000));
}

export function ExtendReservationDialog({
  open, onOpenChange, reservationId, reservationRef, currentReturnDate, pickupDate,
  dailyRate = 0, discountPercentage = 0, existingAdditionalFees = 0, currentTotalAmount = 0,
  contractStatus, status, onSuccess,
}: Props) {
  const [newReturnDate, setNewReturnDate] = useState('');
  const [additionalFees, setAdditionalFees] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const minDate = currentReturnDate ? toDatetimeLocal(currentReturnDate) : '';

  const preview = useMemo(() => {
    if (!newReturnDate || !currentReturnDate || !pickupDate) return null;
    const pickup = new Date(pickupDate);
    const current = new Date(currentReturnDate);
    const next = new Date(newReturnDate);
    if (Number.isNaN(next.getTime()) || next <= current) return null;

    const currentDays = daysBetween(pickup, current);
    const newDays = daysBetween(pickup, next);
    const daysAdded = newDays - currentDays;

    const newSubtotal = dailyRate * newDays;
    const discountAmount = newSubtotal * (discountPercentage / 100);
    const enteredFees = Number(additionalFees) || 0;
    const totalFees = existingAdditionalFees + enteredFees;
    const estimatedTotal = newSubtotal - discountAmount + totalFees;
    const extraToPay = estimatedTotal - currentTotalAmount;

    return { currentDays, newDays, daysAdded, newSubtotal, discountAmount, enteredFees, estimatedTotal, extraToPay, nextDate: next };
  }, [newReturnDate, currentReturnDate, pickupDate, dailyRate, discountPercentage, additionalFees, existingAdditionalFees, currentTotalAmount]);

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
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <IconCalendarPlus className="h-5 w-5" />
              </div>
              Prolonger la réservation
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              Réservation <span className="font-mono font-medium text-white">{reservationRef}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5 max-h-[70vh] overflow-y-auto">
          {contractStatus === 'valid' && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
              <IconAlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              Le contrat déjà généré sera automatiquement dévalidé puis régénéré avec la nouvelle période.
            </div>
          )}

          {/* Date range visual */}
          <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
            <div className="flex-1 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Retour actuel</p>
              <p className="text-sm font-semibold">
                {currentReturnDate ? fmtShort(new Date(currentReturnDate)) : '—'}
              </p>
            </div>
            <IconArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Nouveau retour</p>
              <p className={`text-sm font-semibold ${preview ? 'text-blue-700' : 'text-muted-foreground'}`}>
                {preview ? fmtShort(preview.nextDate) : 'à définir'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-return-date" className="flex items-center gap-1.5 text-sm font-medium">
              <IconClock className="h-3.5 w-3.5" />Nouvelle date &amp; heure de retour *
            </Label>
            <Input
              id="new-return-date"
              type="datetime-local"
              min={minDate}
              value={newReturnDate}
              onChange={e => setNewReturnDate(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extra-fees" className="text-sm font-medium">Frais additionnels (dommages, nettoyage…)</Label>
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

          {/* Live recalculation */}
          {preview && (
            <div className="rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-900">
                  <IconCalculator className="h-4 w-4" />Recalcul estimé
                </div>
                <Badge className="bg-blue-600 hover:bg-blue-600 text-white">
                  +{preview.daysAdded} jour{preview.daysAdded > 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Durée totale ({preview.currentDays} → {preview.newDays} jours)</span>
                  <span className="font-medium text-foreground">{fmtMoney(preview.newSubtotal)} MAD</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Remise ({discountPercentage}%)</span>
                    <span className="font-medium text-red-600">- {fmtMoney(preview.discountAmount)} MAD</span>
                  </div>
                )}
                {(existingAdditionalFees > 0 || preview.enteredFees > 0) && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Frais additionnels</span>
                    <span className="font-medium text-foreground">{fmtMoney(existingAdditionalFees + preview.enteredFees)} MAD</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-900">Nouveau total estimé</span>
                <span className="text-base font-bold text-blue-900">{fmtMoney(preview.estimatedTotal)} MAD</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-blue-600 px-3 py-2 text-white">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <IconReceipt2 className="h-3.5 w-3.5" />Supplément à régler
                </span>
                <span className="text-sm font-bold">
                  {preview.extraToPay >= 0 ? '+' : ''}{fmtMoney(preview.extraToPay)} MAD
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ext-notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="ext-notes"
              placeholder="Raison de la prolongation…"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Annuler</Button>
          <Button onClick={handleExtend} disabled={loading || !newReturnDate} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Prolongation…' : 'Confirmer la prolongation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
