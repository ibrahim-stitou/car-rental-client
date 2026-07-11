'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useCreateReservation, useUpdateReservation } from '../hooks/use-reservations';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import { useClients } from '@/features/clients/hooks/use-clients';
import type { Reservation } from '@/types/reservation.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SelectField } from '@/components/shared/select-field';
import { PAYMENT_METHOD_OPTIONS, FUEL_LEVEL_OPTIONS } from '@/config/constants';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import { applyServerErrors } from '@/lib/form-errors';
import {
  IconAlertTriangle, IconCoin, IconUser, IconCurrencyDirham,
  IconCalendarX, IconUsers,
} from '@tabler/icons-react';

const schema = z.object({
  agency_id:             z.string().min(1, 'Agence requise'),
  vehicle_id:            z.string().min(1, 'Véhicule requis'),
  client_id:             z.string().min(1, 'Client requis'),
  // Second driver (optional)
  second_driver_id:      z.string().optional(),
  second_driver_name:    z.string().optional(),
  second_driver_license: z.string().optional(),
  second_driver_phone:   z.string().optional(),
  // Dates with time
  pickup_date:           z.string().min(1, 'Date de départ requise'),
  return_date:           z.string().min(1, 'Date de retour requise'),
  pickup_location:       z.string().min(1, 'Lieu de départ requis'),
  return_location:       z.string().min(1, 'Lieu de retour requis'),
  daily_rate:            z.coerce.number().min(0),
  deposit_amount:        z.coerce.number().min(0),
  discount_percentage:   z.coerce.number().min(0).max(100).optional(),
  additional_fees:       z.coerce.number().min(0).optional(),
  payment_method:        z.string().optional(),
  notes:                 z.string().optional(),
  agent_notes:           z.string().optional(),
  // Initial payment (create only)
  initial_paid_amount:   z.coerce.number().min(0).optional(),
  initial_payment_method:z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: Reservation | null;
  onSuccess?: () => void;
}

export function ReservationForm({ open, onOpenChange, reservation, onSuccess }: Props) {
  const createMutation = useCreateReservation();
  const updateMutation = useUpdateReservation(reservation?.id ?? '');
  const { data: agenciesRes } = useAgencies({ per_page: 200 });
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const { data: clientsRes } = useClients({ per_page: 200 });
  const [showSecondDriver, setShowSecondDriver] = useState(false);
  const [conflictDismissed, setConflictDismissed] = useState(false);

  const agencies  = (agenciesRes?.data ?? []).map(a => ({ value: a.id, label: a.name, sub: a.city }));
  const vehicles  = (vehiclesRes?.data ?? []).map(v => ({ value: v.id, label: `${v.brand} ${v.model} ${v.year}`, sub: v.registration_number }));
  const clients   = (clientsRes?.data ?? []).map(c => ({ value: c.id, label: `${(c as any).first_name} ${(c as any).last_name}`, sub: (c as any).phone }));
  const rawVehicles = vehiclesRes?.data ?? [];
  const rawClients  = clientsRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      agency_id: '', vehicle_id: '', client_id: '',
      second_driver_id: '', second_driver_name: '', second_driver_license: '', second_driver_phone: '',
      pickup_date: '', return_date: '',
      pickup_location: 'Agence', return_location: 'Agence',
      daily_rate: 0, deposit_amount: 0,
      discount_percentage: 0, additional_fees: 0,
      payment_method: '', notes: '', agent_notes: '',
      initial_paid_amount: 0, initial_payment_method: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    setConflictDismissed(false);
    if (reservation) {
      form.reset({
        agency_id:   reservation.agency_id,
        vehicle_id:  reservation.vehicle_id,
        client_id:   reservation.client_id,
        second_driver_id:      (reservation as any).second_driver_id ?? '',
        second_driver_name:    (reservation as any).second_driver_name ?? '',
        second_driver_license: (reservation as any).second_driver_license ?? '',
        second_driver_phone:   (reservation as any).second_driver_phone ?? '',
        pickup_date:  toDatetimeLocal(reservation.pickup_date),
        return_date:  toDatetimeLocal(reservation.return_date),
        pickup_location:  reservation.pickup_location,
        return_location:  reservation.return_location,
        daily_rate:         Number(reservation.daily_rate),
        deposit_amount:     Number(reservation.deposit_amount),
        discount_percentage:Number(reservation.discount_percentage ?? 0),
        additional_fees:    Number(reservation.additional_fees ?? 0),
        payment_method: reservation.payment_method ?? '',
        notes:       reservation.notes ?? '',
        agent_notes: (reservation as any).agent_notes ?? '',
        initial_paid_amount: 0, initial_payment_method: '',
      });
      setShowSecondDriver(!!(reservation as any).second_driver_id || !!(reservation as any).second_driver_name);
    } else {
      form.reset({
        agency_id: '', vehicle_id: '', client_id: '',
        second_driver_id: '', second_driver_name: '', second_driver_license: '', second_driver_phone: '',
        pickup_date: '', return_date: '',
        pickup_location: 'Agence', return_location: 'Agence',
        daily_rate: 0, deposit_amount: 0,
        discount_percentage: 0, additional_fees: 0,
        payment_method: '', notes: '', agent_notes: '',
        initial_paid_amount: 0, initial_payment_method: '',
      });
      setShowSecondDriver(false);
    }
  }, [reservation, open]);

  // Auto-populate vehicle rate + AdBlue detection
  const vehicleId = form.watch('vehicle_id');
  const clientId  = form.watch('client_id');
  const secondDriverId = form.watch('second_driver_id');
  const pickupDate = form.watch('pickup_date');
  const returnDate = form.watch('return_date');
  const selectedVehicle = rawVehicles.find(v => v.id === vehicleId);
  const hasAdblue = (selectedVehicle as any)?.has_adblue === true;
  const depositAmount = form.watch('deposit_amount');

  useEffect(() => {
    if (!vehicleId || reservation) return;
    const veh = rawVehicles.find(v => v.id === vehicleId);
    if (veh) {
      form.setValue('daily_rate', Number(veh.daily_rate));
      form.setValue('deposit_amount', Number(veh.deposit_amount));
    }
    setConflictDismissed(false);
  }, [vehicleId]);

  useEffect(() => {
    setConflictDismissed(false);
  }, [pickupDate, returnDate]);

  // Conflict check
  const canCheckConflict = !!vehicleId && !!pickupDate && !!returnDate && !conflictDismissed;
  const { data: conflictData } = useQuery({
    queryKey: ['reservation-conflict', vehicleId, pickupDate, returnDate, reservation?.id],
    queryFn: () => apiClient.get(apiRoutes.reservationsExt.checkConflict, {
      params: {
        vehicle_id: vehicleId,
        pickup_date: pickupDate,
        return_date: returnDate,
        exclude_id: reservation?.id,
      },
    }).then(r => r.data?.data),
    enabled: canCheckConflict,
    staleTime: 10_000,
  });
  const hasConflict = !conflictDismissed && conflictData?.has_conflict;

  // Client stats (credit + accidents)
  const { data: clientStatsData } = useQuery({
    queryKey: ['client-stats-brief', clientId],
    queryFn: () => apiClient.get(apiRoutes.clientsExt.statistics(clientId)).then(r => r.data?.data),
    enabled: !!clientId,
  });
  const { data: secondDriverStatsData } = useQuery({
    queryKey: ['client-stats-brief', secondDriverId],
    queryFn: () => apiClient.get(apiRoutes.clientsExt.statistics(secondDriverId!)).then(r => r.data?.data),
    enabled: !!secondDriverId && secondDriverId !== '',
  });

  // Live total calculation
  const daily_rate = form.watch('daily_rate') ?? 0;
  const discount = form.watch('discount_percentage') ?? 0;
  const fees = form.watch('additional_fees') ?? 0;

  let totalDays = 0, subtotal = 0, total = 0;
  if (pickupDate && returnDate) {
    const d1 = new Date(pickupDate), d2 = new Date(returnDate);
    totalDays = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    subtotal = daily_rate * totalDays;
    total = subtotal - subtotal * (discount / 100) + fees;
  }

  const onSubmit = async (values: FormValues) => {
    if (hasConflict) {
      toast.error('Conflit de réservation détecté. Veuillez résoudre le conflit avant de continuer.');
      return;
    }
    const { initial_paid_amount, initial_payment_method, ...rest } = values;
    const payload = {
      ...rest,
      second_driver_id:      values.second_driver_id || undefined,
      second_driver_name:    values.second_driver_name || undefined,
      second_driver_license: values.second_driver_license || undefined,
      second_driver_phone:   values.second_driver_phone || undefined,
      payment_method: values.payment_method || undefined,
      agent_notes:    values.agent_notes || undefined,
    };

    if (reservation) {
      updateMutation.mutate(payload as any, {
        onSuccess: () => { toast.success('Réservation mise à jour'); onOpenChange(false); onSuccess?.(); },
        onError: (err: any) => applyServerErrors(err, form, 'Échec de la mise à jour'),
      });
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: async (res) => {
          const newId = res?.data?.id;
          if (newId && initial_paid_amount && initial_paid_amount > 0) {
            try {
              await (await import('@/services/payment.service')).paymentService.create(newId, {
                amount: initial_paid_amount,
                payment_method: (initial_payment_method || 'cash') as any,
                payment_date: new Date().toISOString().split('T')[0],
                notes: 'Acompte initial',
              });
            } catch {}
          }
          toast.success('Réservation créée');
          onOpenChange(false);
          form.reset();
          onSuccess?.();
        },
        onError: (err: any) => applyServerErrors(err, form, 'Impossible de créer la réservation'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{reservation ? 'Modifier la réservation' : 'Nouvelle réservation'}</SheetTitle>
          <SheetDescription>{reservation ? 'Mettre à jour les détails' : 'Créer une nouvelle réservation de véhicule'}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">

              {/* Agency */}
              <FormField control={form.control} name="agency_id" render={({ field }) => (
                <FormItem><FormLabel>Agence *</FormLabel><FormControl>
                  <SelectField value={field.value} onChange={field.onChange} placeholder="Sélectionner une agence" options={agencies} />
                </FormControl><FormMessage /></FormItem>
              )} />

              {/* Vehicle + Client */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                  <FormItem><FormLabel>Véhicule *</FormLabel><FormControl>
                    <SelectField value={field.value} onChange={field.onChange} placeholder="Sélectionner un véhicule" options={vehicles} />
                  </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="client_id" render={({ field }) => (
                  <FormItem><FormLabel>Client *</FormLabel><FormControl>
                    <SelectField value={field.value} onChange={field.onChange} placeholder="Sélectionner un client" options={clients} />
                  </FormControl><FormMessage /></FormItem>
                )} />
              </div>

              {/* Client credit + accident alerts */}
              {clientStatsData && (
                <ClientAlerts stats={clientStatsData} label="Client principal" />
              )}

              {/* AdBlue alert */}
              {hasAdblue && (
                <Alert className="border-blue-300 bg-blue-50">
                  <IconAlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm font-medium">
                    Ce véhicule est équipé du système <strong>AdBlue</strong>. Informez le client de l'obligation de
                    maintenir le niveau d'urée. En cas de panne, le moteur se bride.
                  </AlertDescription>
                </Alert>
              )}

              {/* Caution alert */}
              {depositAmount > 0 && (
                <Alert className="border-amber-300 bg-amber-50">
                  <IconCoin className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-sm">
                    <strong>Caution : {Number(depositAmount).toLocaleString('fr-MA')} MAD</strong>
                    <br />Préparer et joindre le document de caution au contrat.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Dates with time */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="pickup_date" render={({ field }) => (
                  <FormItem><FormLabel>Date & heure de départ *</FormLabel><FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="return_date" render={({ field }) => (
                  <FormItem><FormLabel>Date & heure de retour *</FormLabel><FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl><FormMessage /></FormItem>
                )} />
              </div>

              {/* Conflict alert */}
              {hasConflict && conflictData?.conflict && (
                <Alert className="border-red-400 bg-red-50">
                  <IconCalendarX className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <AlertDescription className="text-red-800 text-sm">
                    <div className="font-semibold mb-1">Conflit de réservation détecté !</div>
                    <div>Réservation <span className="font-mono font-bold">{conflictData.conflict.reservation_number}</span> — statut : <Badge variant="outline" className="text-xs capitalize">{conflictData.conflict.status}</Badge></div>
                    <div className="text-xs mt-1">
                      {formatDT(conflictData.conflict.pickup_date)} → {formatDT(conflictData.conflict.return_date)}
                      {conflictData.conflict.client && <span> · {conflictData.conflict.client.full_name} ({conflictData.conflict.client.phone})</span>}
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="mt-1 h-6 text-xs text-red-700 hover:text-red-900 p-0" onClick={() => setConflictDismissed(true)}>
                      Ignorer cet avertissement
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Locations */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="pickup_location" render={({ field }) => (
                  <FormItem><FormLabel>Lieu de départ *</FormLabel><FormControl><Input placeholder="Ville / Agence" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="return_location" render={({ field }) => (
                  <FormItem><FormLabel>Lieu de retour *</FormLabel><FormControl><Input placeholder="Ville / Agence" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Separator />

              {/* Second driver toggle */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-1.5"><IconUsers className="h-4 w-4" />Deuxième conducteur</p>
                <Button type="button" variant={showSecondDriver ? 'secondary' : 'outline'} size="sm" onClick={() => setShowSecondDriver(!showSecondDriver)}>
                  {showSecondDriver ? 'Supprimer' : '+ Ajouter'}
                </Button>
              </div>

              {showSecondDriver && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                  <FormField control={form.control} name="second_driver_id" render={({ field }) => (
                    <FormItem><FormLabel>Client enregistré (optionnel)</FormLabel><FormControl>
                      <SelectField value={field.value ?? ''} onChange={v => { field.onChange(v); if (v) { form.setValue('second_driver_name', ''); } }} placeholder="Sélectionner ou laisser vide" options={clients} />
                    </FormControl><FormMessage /></FormItem>
                  )} />

                  {secondDriverStatsData && (
                    <ClientAlerts stats={secondDriverStatsData} label="2ème conducteur" />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="second_driver_name" render={({ field }) => (
                      <FormItem><FormLabel>Nom (si non enregistré)</FormLabel><FormControl><Input placeholder="Nom complet" {...field} disabled={!!form.watch('second_driver_id')} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="second_driver_phone" render={({ field }) => (
                      <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="+212..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="second_driver_license" render={({ field }) => (
                    <FormItem><FormLabel>N° permis de conduire</FormLabel><FormControl><Input placeholder="N° permis" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              )}

              <Separator />

              {/* Financials */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="daily_rate" render={({ field }) => (
                  <FormItem><FormLabel>Tarif/jour (MAD) *</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="deposit_amount" render={({ field }) => (
                  <FormItem><FormLabel>Dépôt de garantie (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="discount_percentage" render={({ field }) => (
                  <FormItem><FormLabel>Remise (%)</FormLabel><FormControl><Input type="number" min={0} max={100} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="additional_fees" render={({ field }) => (
                  <FormItem><FormLabel>Frais supplémentaires (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              {/* Live total */}
              {totalDays > 0 && (
                <div className="rounded-xl border bg-muted/40 p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{totalDays} jour(s) × {daily_rate.toLocaleString('fr-MA')} MAD</span><span className="font-medium">{subtotal.toLocaleString('fr-MA')} MAD</span></div>
                  {discount > 0 && <div className="flex justify-between text-green-600"><span>Remise {discount}%</span><span>- {(subtotal * discount / 100).toLocaleString('fr-MA')} MAD</span></div>}
                  {fees > 0 && <div className="flex justify-between"><span>Frais supp.</span><span>+ {fees.toLocaleString('fr-MA')} MAD</span></div>}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{total.toLocaleString('fr-MA')} MAD</span></div>
                </div>
              )}

              <FormField control={form.control} name="payment_method" render={({ field }) => (
                <FormItem><FormLabel>Mode de paiement</FormLabel>
                  <Select value={field.value || '__none__'} onValueChange={v => field.onChange(v === '__none__' ? '' : v)}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">— Non précisé —</SelectItem>
                      {PAYMENT_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Initial payment (create only) */}
              {!reservation && (
                <>
                  <Separator />
                  <p className="text-sm font-semibold text-muted-foreground">Acompte initial (optionnel)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="initial_paid_amount" render={({ field }) => (
                      <FormItem><FormLabel>Montant payé (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="initial_payment_method" render={({ field }) => (
                      <FormItem><FormLabel>Mode de l'acompte</FormLabel>
                        <Select value={field.value || '__none__'} onValueChange={v => field.onChange(v === '__none__' ? '' : v)}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Espèces" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">— Sélectionner —</SelectItem>
                            {PAYMENT_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                </>
              )}

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Remarques</FormLabel><FormControl><Textarea placeholder="Informations complémentaires…" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="agent_notes" render={({ field }) => (
                <FormItem><FormLabel>Notes agent (libre)</FormLabel><FormControl><Textarea placeholder="Observations personnelles…" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-3 pt-2 pb-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Annuler</Button>
                <Button type="submit" disabled={isPending || (hasConflict && !conflictDismissed)}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {reservation ? 'Mettre à jour' : 'Créer la réservation'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Utility: format datetime for display
function formatDT(iso: string | undefined | null) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

// Utility: convert ISO to datetime-local string (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(iso: string | undefined | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return iso?.split('.')[0]?.replace(' ', 'T').slice(0, 16) ?? ''; }
}

// Client alerts sub-component
function ClientAlerts({ stats, label }: { stats: any; label: string }) {
  const creditBalance = stats?.financials?.credit_balance ?? 0;
  const claimsCount   = stats?.claims_count ?? 0;

  if (creditBalance === 0 && claimsCount === 0) return null;

  return (
    <div className="space-y-1.5">
      {creditBalance > 0 && (
        <Alert className="border-orange-300 bg-orange-50 py-2">
          <IconCurrencyDirham className="h-4 w-4 text-orange-600 flex-shrink-0" />
          <AlertDescription className="text-orange-800 text-xs">
            <strong>{label}</strong> a un crédit impayé de{' '}
            <strong>{Number(creditBalance).toLocaleString('fr-MA')} MAD</strong> sur des réservations précédentes.
          </AlertDescription>
        </Alert>
      )}
      {claimsCount > 0 && (
        <Alert className="border-red-300 bg-red-50 py-2">
          <IconAlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <AlertDescription className="text-red-800 text-xs">
            <strong>{label}</strong> a <strong>{claimsCount} sinistre(s)</strong> enregistré(s).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
