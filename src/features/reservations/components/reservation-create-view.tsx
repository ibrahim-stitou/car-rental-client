'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { parseISO, differenceInCalendarDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft, Save, UserPlus, UserMinus, Car, User, MapPin,
  Calendar, CreditCard, Info, AlertTriangle, ChevronDown, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import PageContainer from '@/components/layout/page-container';
import { useCreateReservation } from '../hooks/use-reservations';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import { useClients } from '@/features/clients/hooks/use-clients';
import { PAYMENT_METHOD_OPTIONS, FUEL_LEVEL_OPTIONS } from '@/config/constants';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

/* ─── Schema ───────────────────────────────────────────────────────────────── */

const schema = z.object({
  agency_id:              z.string().min(1, 'Agence requise'),
  vehicle_id:             z.string().min(1, 'Véhicule requis'),
  client_id:              z.string().min(1, 'Client requis'),
  second_driver_id:       z.string().optional(),
  second_driver_name:     z.string().optional(),
  second_driver_license:  z.string().optional(),
  second_driver_phone:    z.string().optional(),
  pickup_date:            z.string().min(1, 'Date de départ requise'),
  return_date:            z.string().min(1, 'Date de retour requise'),
  pickup_location:        z.string().min(1, 'Lieu de départ requis'),
  return_location:        z.string().min(1, 'Lieu de retour requis'),
  daily_rate:             z.coerce.number().min(0),
  deposit_amount:         z.coerce.number().min(0),
  discount_percentage:    z.coerce.number().min(0).max(100).optional(),
  additional_fees:        z.coerce.number().min(0).optional(),
  payment_method:         z.string().optional(),
  fuel_level_pickup:      z.string().optional(),
  initial_mileage:        z.coerce.number().min(0).optional(),
  notes:                  z.string().optional(),
  agent_notes:            z.string().optional(),
  initial_paid_amount:    z.coerce.number().min(0).optional(),
  initial_payment_method: z.string().optional(),
}).refine(
  d => !d.pickup_date || !d.return_date || d.return_date > d.pickup_date,
  { message: 'La date de retour doit être après la date de départ', path: ['return_date'] }
);

type FormValues = z.infer<typeof schema>;

/* ─── SearchableSelect ────────────────────────────────────────────────────── */

function SearchableSelect({
  value, onChange, placeholder, items, disabled,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  items: Array<{ id: string; label: string; sub?: string }>; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = items.filter(i =>
    i.label.toLowerCase().includes(search.toLowerCase()) ||
    (i.sub ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const selected = items.find(i => i.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox"
          className={cn('w-full justify-between font-normal h-10', !value && 'text-muted-foreground')}
          disabled={disabled}>
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Aucun résultat</CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 60).map(item => (
                <CommandItem key={item.id} value={item.id}
                  onSelect={v => { onChange(v); setOpen(false); setSearch(''); }}>
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

/* ─── DateField ───────────────────────────────────────────────────────────── */

function DateField({
  label, value, onChange, placeholder, minDate,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; minDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : undefined;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline"
            className={cn('w-full justify-start text-left font-normal h-10', !value && 'text-muted-foreground')}>
            <Calendar className="mr-2 h-4 w-4" />
            {parsed ? format(parsed, 'dd/MM/yyyy', { locale: fr }) : (placeholder ?? 'Choisir une date')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarUI
            mode="single"
            selected={parsed}
            onSelect={d => { if (d) { onChange(format(d, 'yyyy-MM-dd')); setOpen(false); } }}
            initialFocus
            disabled={d => !!minDate && d < minDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────────────────────── */

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center gap-2">
        <div className="text-muted-foreground">{icon}</div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export function ReservationCreateView() {
  const router = useRouter();
  const createMutation = useCreateReservation();
  const { data: agenciesRes } = useAgencies({ per_page: 200 });
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const { data: clientsRes } = useClients({ per_page: 200 });

  const [showSecondDriver, setShowSecondDriver] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<string | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  const agencies  = (agenciesRes?.data ?? []).map(a => ({ id: a.id, label: a.name, sub: (a as any).city }));
  const vehicles  = (vehiclesRes?.data ?? []).map(v => ({ id: v.id, label: `${v.brand} ${v.model} ${(v as any).year ?? ''}`.trim(), sub: v.registration_number }));
  const clients   = (clientsRes?.data ?? []).map(c => ({ id: c.id, label: `${(c as any).first_name ?? ''} ${(c as any).last_name ?? ''}`.trim(), sub: (c as any).phone }));
  const rawVehicles = vehiclesRes?.data ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      agency_id: '', vehicle_id: '', client_id: '',
      second_driver_id: '', second_driver_name: '', second_driver_license: '', second_driver_phone: '',
      pickup_date: '', return_date: '',
      pickup_location: '', return_location: '',
      daily_rate: 0, deposit_amount: 0, discount_percentage: 0, additional_fees: 0,
      payment_method: '', fuel_level_pickup: '', initial_mileage: undefined,
      notes: '', agent_notes: '',
      initial_paid_amount: 0, initial_payment_method: '',
    },
  });

  const { watch, setValue } = form;
  const [vehicleId, agencyId, pickupDate, returnDate, dailyRate, discountPct, additionalFees, initialPaid] =
    watch(['vehicle_id', 'agency_id', 'pickup_date', 'return_date', 'daily_rate', 'discount_percentage', 'additional_fees', 'initial_paid_amount']);

  // Auto-fill rate & deposit from selected vehicle
  useEffect(() => {
    if (!vehicleId) return;
    const v = rawVehicles.find(x => x.id === vehicleId);
    if (!v) return;
    if ((v as any).daily_rate) setValue('daily_rate', Number((v as any).daily_rate));
    if ((v as any).deposit_amount) setValue('deposit_amount', Number((v as any).deposit_amount));
  }, [vehicleId, rawVehicles, setValue]);

  // Auto-fill pickup/return location from agency
  useEffect(() => {
    if (!agencyId) return;
    const ag = agenciesRes?.data?.find(x => x.id === agencyId);
    if (!ag) return;
    const loc = `${ag.name}${(ag as any).city ? ' — ' + (ag as any).city : ''}`;
    if (!form.getValues('pickup_location')) setValue('pickup_location', loc);
    if (!form.getValues('return_location')) setValue('return_location', loc);
  }, [agencyId, agenciesRes, setValue, form]);

  // Conflict check
  useEffect(() => {
    if (!vehicleId || !pickupDate || !returnDate) { setConflictInfo(null); return; }
    const ctrl = new AbortController();
    setCheckingConflict(true);
    apiClient.get(apiRoutes.reservationsExt.checkConflict, {
      params: { vehicle_id: vehicleId, pickup_date: pickupDate, return_date: returnDate },
      signal: ctrl.signal,
    }).then(r => {
      const conflicts = (r.data as any)?.data ?? [];
      setConflictInfo(conflicts.length > 0
        ? `Conflit avec ${conflicts[0].reservation_number} (${conflicts[0].status})`
        : null);
    }).catch(() => {}).finally(() => setCheckingConflict(false));
    return () => ctrl.abort();
  }, [vehicleId, pickupDate, returnDate]);

  // Financial calculations
  const days = useMemo(() => {
    if (!pickupDate || !returnDate) return 0;
    try { return Math.max(1, differenceInCalendarDays(parseISO(returnDate), parseISO(pickupDate))); } catch { return 0; }
  }, [pickupDate, returnDate]);
  const subtotal = Number(dailyRate) * days;
  const discount = subtotal * (Number(discountPct ?? 0) / 100);
  const total = subtotal - discount + Number(additionalFees ?? 0);
  const balance = total - Number(initialPaid ?? 0);

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync(values as any);
      toast.success('Réservation créée avec succès');
      router.push('/reservations');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la création');
    }
  };

  return (
    <PageContainer scrollable>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground"
                  onClick={() => router.push('/reservations')}>
                  <ArrowLeft className="h-4 w-4" />Réservations
                </Button>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-lg font-bold">Nouvelle réservation</h1>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.push('/reservations')}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="gap-1.5">
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {createMutation.isPending ? 'Enregistrement…' : 'Créer la réservation'}
                </Button>
              </div>
            </div>

            {/* Conflict alert */}
            {conflictInfo && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 font-medium">{conflictInfo}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <div className="lg:col-span-2 space-y-5">

                {/* Intervenants */}
                <SectionCard icon={<User className="h-4 w-4" />} title="Intervenants">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="agency_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agence <span className="text-red-500">*</span></FormLabel>
                        <SearchableSelect value={field.value} onChange={field.onChange} placeholder="Sélectionner une agence" items={agencies} />
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Véhicule <span className="text-red-500">*</span></FormLabel>
                        <SearchableSelect value={field.value} onChange={field.onChange} placeholder="Sélectionner un véhicule" items={vehicles} />
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="client_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client <span className="text-red-500">*</span></FormLabel>
                        <SearchableSelect value={field.value} onChange={field.onChange} placeholder="Sélectionner un client" items={clients} />
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Second driver toggle */}
                  <div className="mt-4">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5"
                      onClick={() => setShowSecondDriver(p => !p)}>
                      {showSecondDriver ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      {showSecondDriver ? 'Supprimer le 2ᵉ conducteur' : 'Ajouter un 2ᵉ conducteur'}
                    </Button>
                  </div>

                  {showSecondDriver && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                      <FormField control={form.control} name="second_driver_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>2ᵉ conducteur (client)</FormLabel>
                          <SearchableSelect value={field.value ?? ''} onChange={field.onChange} placeholder="Client existant (optionnel)" items={clients} />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="second_driver_name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl><Input {...field} placeholder="Nom du 2ᵉ conducteur" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="second_driver_license" render={({ field }) => (
                        <FormItem>
                          <FormLabel>N° permis</FormLabel>
                          <FormControl><Input {...field} placeholder="Numéro du permis" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="second_driver_phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl><Input {...field} placeholder="+212…" /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  )}
                </SectionCard>

                {/* Dates & lieux */}
                <SectionCard icon={<Calendar className="h-4 w-4" />} title="Période & localisation">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="pickup_date" render={({ field }) => (
                      <FormItem>
                        <DateField label="Date de départ *" value={field.value} onChange={field.onChange} placeholder="Choisir la date de départ" />
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="return_date" render={({ field }) => (
                      <FormItem>
                        <DateField label="Date de retour *" value={field.value} onChange={field.onChange}
                          placeholder="Choisir la date de retour"
                          minDate={pickupDate ? parseISO(pickupDate) : undefined}
                        />
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="pickup_location" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lieu de départ <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input {...field} placeholder="Agence, ville…" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="return_location" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lieu de retour <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input {...field} placeholder="Agence, ville…" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  {days > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" />{days} jour{days > 1 ? 's' : ''}</Badge>
                      {checkingConflict && <span className="text-xs text-muted-foreground">Vérification des conflits…</span>}
                    </div>
                  )}
                </SectionCard>

                {/* Tarification */}
                <SectionCard icon={<CreditCard className="h-4 w-4" />} title="Tarification">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField control={form.control} name="daily_rate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarif/jour <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="discount_percentage" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remise %</FormLabel>
                        <FormControl><Input type="number" min={0} max={100} step={0.01} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="additional_fees" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frais supp.</FormLabel>
                        <FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="deposit_amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caution</FormLabel>
                        <FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </SectionCard>

                {/* Véhicule départ */}
                <SectionCard icon={<Car className="h-4 w-4" />} title="État du véhicule au départ">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField control={form.control} name="fuel_level_pickup" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Niveau carburant</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Niveau" /></SelectTrigger>
                          <SelectContent>
                            {FUEL_LEVEL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="initial_mileage" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kilométrage départ</FormLabel>
                        <FormControl><Input type="number" min={0} placeholder="ex. 45000" {...field} value={field.value ?? ''} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="payment_method" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode paiement</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Paiement" /></SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                </SectionCard>

                {/* Notes */}
                <SectionCard icon={<Info className="h-4 w-4" />} title="Notes">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes client</FormLabel>
                        <FormControl><Textarea rows={3} placeholder="Remarques visibles par le client…" className="resize-none" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="agent_notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes internes</FormLabel>
                        <FormControl><Textarea rows={3} placeholder="Notes confidentielles (agents uniquement)…" className="resize-none" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                </SectionCard>
              </div>

              {/* Right sidebar */}
              <div className="space-y-4">

                {/* Summary */}
                <Card className="border-2 border-primary/10 sticky top-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{days}j × {Number(dailyRate).toLocaleString('fr-MA')} MAD</span>
                      <span className="font-mono">{subtotal.toLocaleString('fr-MA')} MAD</span>
                    </div>
                    {Number(discountPct ?? 0) > 0 && (
                      <div className="flex justify-between text-sm text-green-700">
                        <span>Remise {discountPct}%</span>
                        <span className="font-mono">-{discount.toLocaleString('fr-MA')} MAD</span>
                      </div>
                    )}
                    {Number(additionalFees ?? 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frais sup.</span>
                        <span className="font-mono">+{Number(additionalFees).toLocaleString('fr-MA')} MAD</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="font-mono text-lg">{total.toLocaleString('fr-MA')} MAD</span>
                    </div>

                    <Separator />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paiement à la création</p>
                    <div className="space-y-2">
                      <FormField control={form.control} name="initial_paid_amount" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Montant payé</FormLabel>
                          <FormControl><Input type="number" min={0} step={0.01} {...field} value={field.value ?? 0} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="initial_payment_method" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Mode</FormLabel>
                          <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Mode" /></SelectTrigger>
                            <SelectContent>
                              {PAYMENT_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </div>

                    {Number(initialPaid ?? 0) > 0 && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Solde restant</span>
                          <span className={`font-mono ${balance <= 0 ? 'text-green-700' : 'text-amber-700'}`}>
                            {Math.max(0, balance).toLocaleString('fr-MA')} MAD
                          </span>
                        </div>
                      </>
                    )}

                    <Button type="submit" className="w-full gap-1.5 mt-2" disabled={createMutation.isPending}>
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {createMutation.isPending ? 'Création…' : 'Créer la réservation'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
