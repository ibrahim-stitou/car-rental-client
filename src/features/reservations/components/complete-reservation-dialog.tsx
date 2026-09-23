'use client';

import { useEffect, useState } from 'react';
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

interface EarlyReturnPreview {
  is_early_return: boolean;
  is_late_return?: boolean;
  unit?: 'day' | 'hour' | 'month';
  actual_days: number;
  contracted_days: number;
  suggested_total_amount: number;
  extra_units_detected?: number;
  extra_unit_rate?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  reservationRef: string;
  initialMileage?: number;
  returnLocation?: string;
  /** Reservation's originally contracted return date/time (ISO) — used to detect an early return. */
  scheduledReturnDate?: string;
  onSuccess?: () => void;
}

export function CompleteReservationDialog({
  open, onOpenChange, reservationId, reservationRef, initialMileage, returnLocation, scheduledReturnDate, onSuccess,
}: Props) {
  const [finalMileage, setFinalMileage] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [additionalFees, setAdditionalFees] = useState('');
  const [actualReturnDate, setActualReturnDate] = useState(nowForDatetimeLocal());
  const [actualReturnLocation, setActualReturnLocation] = useState(returnLocation ?? '');
  const [isFavorable, setIsFavorable] = useState<string>('favorable');
  const [closureComment, setClosureComment] = useState('');
  const [loading, setLoading] = useState(false);

  const [returnPreview, setReturnPreview] = useState<EarlyReturnPreview | null>(null);
  // How many of the detected late days/hours the agent actually wants to bill
  // (0..extra_units_detected — e.g. 1 of 2 extra days, or none at all even if
  // the car came back late). Kept as a string to match <Input> state; reset
  // to the full detected count each time a new late-return preview arrives.
  const [confirmedExtraDays, setConfirmedExtraDays] = useState('');

  const mileageDiff = finalMileage && initialMileage
    ? Number(finalMileage) - initialMileage
    : null;
  const mileageError = finalMileage && initialMileage && Number(finalMileage) < initialMileage;

  // Detect an early or late return and fetch a proration/extra-days preview
  // (debounced). The price itself is never editable from this dialog — early
  // returns are billed automatically from the prorated suggestion, late
  // returns only from the agent's explicit extra-days confirmation below.
  useEffect(() => {
    if (!scheduledReturnDate || !actualReturnDate) { setReturnPreview(null); return; }
    const actual = new Date(actualReturnDate);
    const scheduled = new Date(scheduledReturnDate);
    if (Number.isNaN(actual.getTime()) || actual.getTime() === scheduled.getTime()) {
      setReturnPreview(null);
      return;
    }

    const timeout = setTimeout(() => {
      apiClient.get(apiRoutes.reservationsExt.earlyReturnPreview(reservationId), {
        params: { actual_return_date: actual.toISOString() },
      }).then((res) => {
        const preview = res.data?.data as EarlyReturnPreview | undefined;
        if (preview) {
          setReturnPreview(preview);
          if (preview.is_late_return) setConfirmedExtraDays(String(preview.extra_units_detected ?? 0));
        }
      }).catch(() => setReturnPreview(null));
    }, 400);

    return () => clearTimeout(timeout);
  }, [actualReturnDate, scheduledReturnDate, reservationId]);

  const extraDaysDetected = returnPreview?.is_late_return ? (returnPreview.extra_units_detected ?? 0) : 0;
  const extraDaysUnitLabel = returnPreview?.unit === 'hour' ? 'heure(s)' : 'jour(s)';
  const confirmedExtraDaysNum = Math.min(extraDaysDetected, Math.max(0, Number(confirmedExtraDays) || 0));
  const extraDaysAmount = confirmedExtraDaysNum * (returnPreview?.extra_unit_rate ?? 0);

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
        confirmed_extra_days: extraDaysDetected > 0 ? confirmedExtraDaysNum : undefined,
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

          {returnPreview?.is_early_return && (
            <Alert className="border-blue-200 bg-blue-50">
              <IconAlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm space-y-1">
                <p>
                  Retour anticipé détecté : <strong>{returnPreview.actual_days} {returnPreview.unit === 'hour' ? 'heure(s)' : 'jour(s)'}</strong> sur{' '}
                  <strong>{returnPreview.contracted_days} {returnPreview.unit === 'hour' ? 'heure(s)' : 'jour(s)'}</strong> prévus.
                </p>
                <p>
                  Montant recalculé automatiquement : <strong>{returnPreview.suggested_total_amount.toLocaleString('fr-MA')} MAD</strong>.
                </p>
                <p className="text-xs opacity-80">Le prix n&apos;est pas modifiable depuis cet écran — il est recalculé au prorata de la durée réellement effectuée.</p>
              </AlertDescription>
            </Alert>
          )}

          {returnPreview?.is_late_return && extraDaysDetected > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <IconAlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900 text-sm space-y-2">
                <p>
                  Retour tardif détecté : <strong>{extraDaysDetected} {extraDaysUnitLabel} de plus</strong> que prévu
                  {' '}(prix : {(returnPreview.extra_unit_rate ?? 0).toLocaleString('fr-MA')} MAD / {returnPreview.unit === 'hour' ? 'heure' : 'jour'}).
                </p>
                <div className="space-y-1">
                  <Label htmlFor="confirmed-extra-days">
                    Combien de {extraDaysUnitLabel} supplémentaires facturer ? (0 à {extraDaysDetected})
                  </Label>
                  <Input
                    id="confirmed-extra-days"
                    type="number"
                    min={0}
                    max={extraDaysDetected}
                    value={confirmedExtraDays}
                    onChange={(e) => setConfirmedExtraDays(e.target.value)}
                  />
                </div>
                {confirmedExtraDaysNum > 0 ? (
                  <p>
                    Montant ajouté : <strong>+{extraDaysAmount.toLocaleString('fr-MA')} MAD</strong> ({confirmedExtraDaysNum} {extraDaysUnitLabel} × {(returnPreview.extra_unit_rate ?? 0).toLocaleString('fr-MA')} MAD)
                  </p>
                ) : (
                  <p className="text-xs opacity-80">Aucun jour supplémentaire ne sera facturé.</p>
                )}
              </AlertDescription>
            </Alert>
          )}

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
