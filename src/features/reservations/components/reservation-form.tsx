'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Search, ChevronDown } from 'lucide-react';
import { useCreateReservation, useUpdateReservation } from '../hooks/use-reservations';
import { useAddPayment } from '../hooks/use-payments';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PAYMENT_METHOD_OPTIONS } from '@/config/constants';
import { cn } from '@/lib/utils';

const schema = z.object({
  agency_id: z.string().min(1, 'Agence requise'),
  vehicle_id: z.string().min(1, 'Véhicule requis'),
  client_id: z.string().min(1, 'Client requis'),
  pickup_date: z.string().min(1, 'Date de départ requise'),
  return_date: z.string().min(1, 'Date de retour requise'),
  pickup_location: z.string().min(1, 'Lieu de départ requis'),
  return_location: z.string().min(1, 'Lieu de retour requis'),
  daily_rate: z.coerce.number().min(0),
  deposit_amount: z.coerce.number().min(0),
  discount_percentage: z.coerce.number().min(0).max(100).optional(),
  additional_fees: z.coerce.number().min(0).optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  // Initial payment (create only)
  initial_paid_amount: z.coerce.number().min(0).optional(),
  initial_payment_method: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// Combobox component for searchable select
function SearchableSelect({
  value, onChange, placeholder, items, displayFn, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  items: Array<{ id: string; label: string; sub?: string }>;
  displayFn?: (id: string) => string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(search.toLowerCase()) ||
    (i.sub ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const selected = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn('w-full justify-between font-normal h-10', !value && 'text-muted-foreground')}
          disabled={disabled}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Aucun résultat</CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 50).map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={(v) => { onChange(v); setOpen(false); setSearch(''); }}
                >
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    {item.sub && <div className="text-xs text-muted-foreground">{item.sub}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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

  const agencies = (agenciesRes?.data ?? []).map((a) => ({ id: a.id, label: a.name, sub: a.city }));
  const vehicles = (vehiclesRes?.data ?? []).map((v) => ({ id: v.id, label: `${v.brand} ${v.model} ${v.year}`, sub: v.registration_number }));
  const clients = (clientsRes?.data ?? []).map((c) => ({ id: c.id, label: `${c.first_name} ${c.last_name}`, sub: c.phone }));

  const rawVehicles = vehiclesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      agency_id: '', vehicle_id: '', client_id: '',
      pickup_date: '', return_date: '',
      pickup_location: 'Agence', return_location: 'Agence',
      daily_rate: 0, deposit_amount: 0,
      discount_percentage: 0, additional_fees: 0,
      payment_method: '', notes: '',
      initial_paid_amount: 0, initial_payment_method: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (reservation) {
      form.reset({
        agency_id: reservation.agency_id,
        vehicle_id: reservation.vehicle_id,
        client_id: reservation.client_id,
        pickup_date: reservation.pickup_date?.split('T')[0] ?? '',
        return_date: reservation.return_date?.split('T')[0] ?? '',
        pickup_location: reservation.pickup_location,
        return_location: reservation.return_location,
        daily_rate: Number(reservation.daily_rate),
        deposit_amount: Number(reservation.deposit_amount),
        discount_percentage: Number(reservation.discount_percentage ?? 0),
        additional_fees: Number(reservation.additional_fees ?? 0),
        payment_method: reservation.payment_method ?? '',
        notes: reservation.notes ?? '',
        initial_paid_amount: 0, initial_payment_method: '',
      });
    } else {
      form.reset({
        agency_id: '', vehicle_id: '', client_id: '',
        pickup_date: '', return_date: '',
        pickup_location: 'Agence', return_location: 'Agence',
        daily_rate: 0, deposit_amount: 0,
        discount_percentage: 0, additional_fees: 0,
        payment_method: '', notes: '',
        initial_paid_amount: 0, initial_payment_method: '',
      });
    }
  }, [reservation, open]);

  // Auto-populate vehicle rate
  const vehicleId = form.watch('vehicle_id');
  useEffect(() => {
    if (!vehicleId || reservation) return;
    const veh = rawVehicles.find((v) => v.id === vehicleId);
    if (veh) {
      form.setValue('daily_rate', Number(veh.daily_rate));
      form.setValue('deposit_amount', Number(veh.deposit_amount));
    }
  }, [vehicleId]);

  // Live total calculation
  const daily_rate = form.watch('daily_rate') ?? 0;
  const pickup_date = form.watch('pickup_date');
  const return_date = form.watch('return_date');
  const discount = form.watch('discount_percentage') ?? 0;
  const fees = form.watch('additional_fees') ?? 0;

  let totalDays = 0;
  let subtotal = 0;
  let total = 0;
  if (pickup_date && return_date) {
    const d1 = new Date(pickup_date);
    const d2 = new Date(return_date);
    totalDays = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    subtotal = daily_rate * totalDays;
    const discountAmt = subtotal * (discount / 100);
    total = subtotal - discountAmt + fees;
  }

  const onSubmit = async (values: FormValues) => {
    const { initial_paid_amount, initial_payment_method, ...rest } = values;
    const payload = {
      ...rest,
      pickup_date: values.pickup_date + 'T09:00:00',
      return_date: values.return_date + 'T09:00:00',
      payment_method: values.payment_method || undefined,
    };

    if (reservation) {
      updateMutation.mutate(payload as any, {
        onSuccess: () => { toast.success('Réservation mise à jour'); onOpenChange(false); onSuccess?.(); },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Échec de la mise à jour'),
      });
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: async (res) => {
          const newId = res?.data?.id;
          // Record initial payment if provided
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
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Impossible de créer la réservation'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{reservation ? 'Modifier la réservation' : 'Nouvelle réservation'}</SheetTitle>
          <SheetDescription>
            {reservation ? 'Mettre à jour les détails de la réservation' : 'Créer une nouvelle réservation de véhicule'}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Agence / Véhicule / Client */}
              <div className="grid grid-cols-1 gap-4">
                <FormField control={form.control} name="agency_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agence *</FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onChange={field.onChange} placeholder="Sélectionner une agence" items={agencies} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Véhicule *</FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onChange={field.onChange} placeholder="Sélectionner un véhicule" items={vehicles} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="client_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onChange={field.onChange} placeholder="Sélectionner un client" items={clients} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="pickup_date" render={({ field }) => (
                  <FormItem><FormLabel>Date de départ *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="return_date" render={({ field }) => (
                  <FormItem><FormLabel>Date de retour *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

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
                <FormItem>
                  <FormLabel>Mode de paiement</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Initial payment (create only) */}
              {!reservation && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3 text-muted-foreground">Acompte initial (optionnel)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="initial_paid_amount" render={({ field }) => (
                        <FormItem><FormLabel>Montant payé (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="initial_payment_method" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mode de l'acompte</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Espèces" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {PAYMENT_METHOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </>
              )}

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Remarques</FormLabel><FormControl><Textarea placeholder="Informations complémentaires…" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-3 pt-2 pb-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Annuler</Button>
                <Button type="submit" disabled={isPending}>
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
