'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FUEL_LEVEL_OPTIONS } from '@/config/constants';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import { IconGauge, IconAlertTriangle } from '@tabler/icons-react';

function nowForDatetimeLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  reservationRef: string;
  initialMileage?: number;
  returnLocation?: string;
  onSuccess?: () => void;
}

export function CompleteReservationDialog({
  open, onOpenChange, reservationId, reservationRef, initialMileage, returnLocation, onSuccess,
}: Props) {
  const [finalMileage, setFinalMileage] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [additionalFees, setAdditionalFees] = useState('');
  const [actualReturnDate, setActualReturnDate] = useState(nowForDatetimeLocal());
  const [actualReturnLocation, setActualReturnLocation] = useState(returnLocation ?? '');
  const [isFavorable, setIsFavorable] = useState<string>('favorable');
  const [closureComment, setClosureComment] = useState('');
  const [loading, setLoading] = useState(false);

  const mileageDiff = finalMileage && initialMileage
    ? Number(finalMileage) - initialMileage
    : null;
  const mileageError = finalMileage && initialMileage && Number(finalMileage) < initialMileage;

  const handleComplete = async () => {
    if (mileageError) {
      toast.error('Le kilométrage retour ne peut pas être inférieur au kilométrage de départ');
      return;
    }
    setLoading(true);
    try {
      await apiClient.patch(apiRoutes.reservations.complete(reservationId), {
        final_mileage: finalMileage ? Number(finalMileage) : undefined,
        fuel_level_return: fuelLevel || undefined,
        additional_fees: additionalFees ? Number(additionalFees) : undefined,
        actual_return_date: actualReturnDate ? new Date(actualReturnDate).toISOString() : undefined,
        actual_return_location: actualReturnLocation || undefined,
        is_favorable: isFavorable === 'favorable',
        closure_comment: closureComment || undefined,
      });
      toast.success(`Réservation ${reservationRef} clôturée`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la clôture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconGauge className="h-5 w-5 text-slate-600" />
            Clôturer la réservation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            Réservation <span className="font-mono font-medium text-foreground">{reservationRef}</span>
          </div>

          {initialMileage !== undefined && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Kilométrage départ : </span>
              <span className="font-semibold">{initialMileage.toLocaleString('fr-MA')} km</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="final-mileage">Kilométrage retour (km)</Label>
            <Input
              id="final-mileage"
              type="number"
              min={initialMileage ?? 0}
              placeholder={initialMileage ? `Min. ${initialMileage.toLocaleString('fr-MA')} km` : 'Kilométrage au retour'}
              value={finalMileage}
              onChange={(e) => setFinalMileage(e.target.value)}
              className={mileageError ? 'border-red-500' : ''}
            />
            {mileageError && (
              <p className="text-xs text-red-600">Le kilométrage retour doit être ≥ au kilométrage départ</p>
            )}
            {mileageDiff !== null && mileageDiff >= 0 && (
              <p className="text-xs text-muted-foreground">Distance parcourue : <strong>{mileageDiff.toLocaleString('fr-MA')} km</strong></p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Niveau carburant retour</Label>
            <Select value={fuelLevel} onValueChange={setFuelLevel}>
              <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent>
                {FUEL_LEVEL_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="actual-return-date">Date et heure de retour</Label>
              <Input
                id="actual-return-date"
                type="datetime-local"
                value={actualReturnDate}
                onChange={(e) => setActualReturnDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual-return-location">Lieu de retour</Label>
              <Input
                id="actual-return-location"
                placeholder="Lieu de retour"
                value={actualReturnLocation}
                onChange={(e) => setActualReturnLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Avis de clôture</Label>
            <Select value={isFavorable} onValueChange={setIsFavorable}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="favorable">Favorable</SelectItem>
                <SelectItem value="unfavorable">Non favorable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closure-comment">Commentaire</Label>
            <Textarea
              id="closure-comment"
              rows={2}
              placeholder="Observations sur l'état du véhicule, incidents, etc."
              value={closureComment}
              onChange={(e) => setClosureComment(e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-fees">Frais supplémentaires (MAD)</Label>
            <Input
              id="additional-fees"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={additionalFees}
              onChange={(e) => setAdditionalFees(e.target.value)}
            />
          </div>

          {additionalFees && Number(additionalFees) > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <IconAlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                Des frais supplémentaires de <strong>{Number(additionalFees).toLocaleString('fr-MA')} MAD</strong> seront ajoutés au total.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Annuler</Button>
          <Button onClick={handleComplete} disabled={loading || !!mileageError}>
            {loading ? 'Clôture en cours…' : 'Confirmer le retour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
