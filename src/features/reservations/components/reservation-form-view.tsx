'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { parseISO, differenceInMilliseconds, format, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { dateOnlyLocal } from '@/utils/date-utils';
import {
  ArrowLeft, Save, UserPlus, UserMinus, Car, User,
  Calendar, CreditCard, Info, AlertTriangle, Loader2, CalendarX, Coins, CircleDollarSign,
  Paperclip, Trash2, Plus, Clock, Building2, CheckCircle2, Lock,
} from 'lucide-react';
import { DocumentsSection } from '@/components/shared/documents-section';
import CustomAlertDialog from '@/components/custom/customAlert';
import { FileUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageContainer from '@/components/layout/page-container';
import { SelectField } from '@/components/shared/select-field';
import { DateTimeField } from './date-time-field';
import { useCreateReservation, useUpdateReservation } from '../hooks/use-reservations';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import { useClients, useClient } from '@/features/clients/hooks/use-clients';
import { useDebounce } from '@/hooks/use-debounce';
import { PAYMENT_METHOD_OPTIONS, FUEL_LEVEL_OPTIONS } from '@/config/constants';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { applyServerErrors } from '@/lib/form-errors';
import type { Reservation } from '@/types/reservation.types';

/* ─── Schema ───────────────────────────────────────────────────────────────── */

// Base field shapes, kept separate from the create/edit-specific `.refine()`
// chains below — ZodEffects (what `.refine()` returns) only unwraps ONE
// level via `.innerType()`, so stacking refines directly on createSchema and
// then trying `createSchema.innerType().pick(...)` for editSchema would
// break the moment a second refine is added. Both schemas derive from this
// raw ZodObject instead.
const reservationFieldsSchema = z.object({
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
  rental_unit:            z.enum(['day', 'hour', 'month']).optional(),
  daily_rate:             z.coerce.number().min(0),
  hourly_rate:            z.coerce.number().min(0).optional(),
  monthly_rate:           z.coerce.number().min(0).optional(),
  // Transient UI-only fields driving the hour/month quick-pick chips — never
  // sent to the backend, only used to compute return_date locally.
  duration_hours:         z.coerce.number().min(1).max(240).optional(),
  duration_months:        z.coerce.number().min(1).max(120).optional(),
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
});

// Shared duration/rate-per-unit consistency rules — applied to both the
// create and edit schemas so "picked LLD but left the monthly amount blank"
// is caught client-side in either flow, not just at creation.
function withRentalUnitRules<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .refine(
      (d: any) => !d.pickup_date || !d.return_date || d.return_date > d.pickup_date,
      { message: 'La date de retour doit être après la date de départ', path: ['return_date'] }
    )
    .refine(
      (d: any) => d.rental_unit !== 'hour' || (d.duration_hours ?? 0) >= 1,
      { message: 'Durée requise', path: ['duration_hours'] }
    )
    .refine(
      (d: any) => d.rental_unit !== 'month' || (d.duration_months ?? 0) >= 1,
      { message: 'Durée du contrat requise', path: ['duration_months'] }
    );
}

const createSchema = withRentalUnitRules(reservationFieldsSchema);

// Edit mode: agency/vehicle/client/second driver/agent_notes are immutable
// backend-side (UpdateReservationRequest doesn't accept them), so they're
// dropped from the schema and rendered read-only instead. rental_unit itself
// isn't part of the edit field set (the type is locked after creation — see
// the read-only display in the form below) but the picked fields still need
// it for the refine rules above to evaluate against the *existing*
// reservation's type, so it's threaded in separately at validation time.
const editSchema = withRentalUnitRules(reservationFieldsSchema.pick({
  pickup_date: true, return_date: true, pickup_location: true, return_location: true,
  daily_rate: true, hourly_rate: true, duration_hours: true,
  monthly_rate: true, duration_months: true,
  deposit_amount: true, discount_percentage: true, additional_fees: true,
  payment_method: true, fuel_level_pickup: true, initial_mileage: true, notes: true,
}));

const DOC_ACCEPT = { 'image/jpeg': [], 'image/png': [], 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] };
const DOC_MAX = 10 * 1024 * 1024;

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type FormValues = CreateValues & Partial<EditValues>;

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

/* ─── Rental type selector ───────────────────────────────────────────────
   A prominent, card-based "what kind of rental is this" step, front and
   center between choosing the vehicle and entering dates/pricing — the
   choice made here reshapes the rest of the form (date picker vs. hour
   chips vs. month chips, daily/hourly/monthly rate). Locked read-only once
   a reservation exists, since switching types after creation would leave
   stale total_days/hours/months and pricing behind. */
type RentalTypeValue = 'day' | 'hour' | 'month';

const RENTAL_TYPE_META: Record<RentalTypeValue, {
  icon: React.ReactNode; label: string; description: string; accent: string;
}> = {
  day:   { icon: <Car className="h-5 w-5" />, label: 'Journalière', description: 'Location classique, facturée au jour', accent: 'blue' },
  hour:  { icon: <Clock className="h-5 w-5" />, label: 'Horaire', description: 'Courte durée, facturée à l’heure', accent: 'violet' },
  month: { icon: <Building2 className="h-5 w-5" />, label: 'Longue durée (LLD)', description: 'Contrat multi-mois à tarif mensuel', accent: 'amber' },
};

const ACCENT_CLASSES: Record<string, { ring: string; icon: string; iconText: string }> = {
  blue:   { ring: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/60',       icon: 'bg-blue-100 text-blue-700',     iconText: 'text-blue-700' },
  violet: { ring: 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/60', icon: 'bg-violet-100 text-violet-700', iconText: 'text-violet-700' },
  amber:  { ring: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/60',    icon: 'bg-amber-100 text-amber-700',   iconText: 'text-amber-700' },
};

const RATE_FIELD_NAME: Record<RentalTypeValue, 'daily_rate' | 'hourly_rate' | 'monthly_rate'> = {
  day: 'daily_rate', hour: 'hourly_rate', month: 'monthly_rate',
};

/** The rate input for a given type — shared between the selectable create-mode
 * card and the locked edit-mode display, so editing the tarif works the same
 * way (and lives in the same place) in both flows. */
function RentalRateInlineField({ type, control }: { type: RentalTypeValue; control: any }) {
  const rateLabel = type === 'day' ? '/ jour' : type === 'hour' ? '/ heure' : '/ mois';
  return (
    <FormField control={control} name={RATE_FIELD_NAME[type]} render={({ field }) => (
      <FormItem onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <FormControl>
            <Input type="number" min={0} step={0.01} placeholder="0.00" className="h-8 w-24 font-mono text-sm bg-background"
                   {...field} value={field.value ?? ''} />
          </FormControl>
          <span className="text-xs text-muted-foreground whitespace-nowrap">MAD {rateLabel}</span>
        </div>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function RentalTypeOptionCard({ type, selected, control, onSelect }: {
  type: RentalTypeValue; selected: boolean; control: any; onSelect: () => void;
}) {
  const meta = RENTAL_TYPE_META[type];
  const accent = ACCENT_CLASSES[meta.accent];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      className={[
        'relative flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all cursor-pointer',
        selected ? `${accent.ring} shadow-sm` : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30',
      ].join(' ')}
    >
      {selected && (
        <CheckCircle2 className={`absolute right-3 top-3 h-5 w-5 ${accent.iconText}`} />
      )}
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent.icon}`}>
        {meta.icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{meta.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
      </div>
      {selected ? (
        <RentalRateInlineField type={type} control={control} />
      ) : (
        <p className="text-[11px] text-muted-foreground italic">Cliquer pour sélectionner</p>
      )}
    </div>
  );
}

function RentalTypeSelector({ value, onSelect, control }: {
  value: RentalTypeValue; onSelect: (v: RentalTypeValue) => void; control: any;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <RentalTypeOptionCard type="day" selected={value === 'day'} control={control} onSelect={() => onSelect('day')} />
      <RentalTypeOptionCard type="hour" selected={value === 'hour'} control={control} onSelect={() => onSelect('hour')} />
      <RentalTypeOptionCard type="month" selected={value === 'month'} control={control} onSelect={() => onSelect('month')} />
    </div>
  );
}

/** Edit mode: the type itself can't change after creation, but the tarif still can. */
function RentalTypeLocked({ value, control }: { value: RentalTypeValue; control: any }) {
  const meta = RENTAL_TYPE_META[value];
  const accent = ACCENT_CLASSES[meta.accent];
  return (
    <div className={`flex items-center gap-3 rounded-xl border-2 ${accent.ring} p-4`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent.icon}`}>{meta.icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{meta.label}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Lock className="h-3 w-3" />Type fixé à la création
        </p>
      </div>
      <RentalRateInlineField type={value} control={control} />
    </div>
  );
}

function ReadOnlyField({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <FormLabel className="text-sm">{label}</FormLabel>
      <div className="mt-1.5 h-10 flex items-center rounded-md border bg-muted/40 px-3 text-sm">
        <div className="truncate">
          <span className="font-medium">{value || '—'}</span>
          {sub && <span className="text-muted-foreground ml-1.5 text-xs">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

// Client / second-driver credit & accident alerts
function ClientAlerts({ stats, label }: { stats: any; label: string }) {
  const creditBalance = stats?.financials?.credit_balance ?? 0;
  const claimsCount   = stats?.claims_count ?? 0;
  if (creditBalance === 0 && claimsCount === 0) return null;
  return (
    <div className="space-y-1.5">
      {creditBalance > 0 && (
        <Alert className="border-orange-300 bg-orange-50 py-2">
          <CircleDollarSign className="h-4 w-4 text-orange-600 flex-shrink-0" />
          <AlertDescription className="text-orange-800 text-xs">
            <strong>{label}</strong> a un crédit impayé de{' '}
            <strong>{Number(creditBalance).toLocaleString('fr-MA')} MAD</strong> sur des réservations précédentes.
          </AlertDescription>
        </Alert>
      )}
      {claimsCount > 0 && (
        <Alert className="border-red-300 bg-red-50 py-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <AlertDescription className="text-red-800 text-xs">
            <strong>{label}</strong> a <strong>{claimsCount} sinistre(s)</strong> enregistré(s).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function formatDT(iso: string | undefined | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

/* ─── Main component ──────────────────────────────────────────────────────── */

interface Props {
  reservation?: Reservation | null;
}

const CONTRACT_RELEVANT_EDIT_FIELDS = [
  'pickup_date', 'return_date', 'pickup_location', 'return_location',
  'daily_rate', 'hourly_rate', 'duration_hours', 'monthly_rate', 'duration_months',
  'discount_percentage', 'additional_fees',
] as const;

export function ReservationFormView({ reservation }: Props) {
  const router = useRouter();
  const isEdit = !!reservation;
  const createMutation = useCreateReservation();
  const updateMutation = useUpdateReservation(reservation?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;
  const [confirmInvalidateOpen, setConfirmInvalidateOpen] = useState(false);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<object | null>(null);

  const { data: agenciesRes } = useAgencies({ per_page: 200 });
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });

  // Clients are searched server-side (not loaded wholesale): the base has
  // grown to thousands of rows (migrated history included), each carrying
  // several media lookups server-side, so loading them all up front isn't viable.
  const [clientSearch, setClientSearch] = useState('');
  const debouncedClientSearch = useDebounce(clientSearch, 300);
  const { data: clientsRes } = useClients({ per_page: 20, search: debouncedClientSearch || undefined });

  const [showSecondDriver, setShowSecondDriver] = useState(false);
  const [conflictDismissed, setConflictDismissed] = useState(false);

  // Documents staged locally at creation time — uploaded right after the reservation is created
  const [pendingDocs, setPendingDocs] = useState<{ file: File; title: string }[]>([]);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const docFile = docFiles[0] ?? null;
  const [docTitle, setDocTitle] = useState('');

  const addPendingDoc = () => {
    if (!docFile || !docTitle.trim()) return;
    setPendingDocs(prev => [...prev, { file: docFile, title: docTitle.trim() }]);
    setDocFiles([]);
    setDocTitle('');
  };
  const removePendingDoc = (idx: number) => setPendingDocs(prev => prev.filter((_, i) => i !== idx));

  const agencies  = (agenciesRes?.data ?? []).map(a => ({ value: a.id, label: a.name, sub: (a as any).city }));
  const vehicles  = (vehiclesRes?.data ?? []).map(v => ({ value: v.id, label: `${v.brand} ${v.model} ${(v as any).year ?? ''}`.trim(), sub: v.registration_number }));
  const rawVehicles = vehiclesRes?.data ?? [];
  const toClientOption = (c: any) => ({
    value: c.id,
    label: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
    sub: c.id_number ? `${c.phone ?? ''} · CIN ${c.id_number}` : c.phone,
    keywords: c.id_number,
  });

  const schema = isEdit ? editSchema : createSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: isEdit ? {
      pickup_date: toDatetimeLocal(reservation!.pickup_date),
      return_date: toDatetimeLocal(reservation!.return_date),
      pickup_location: reservation!.pickup_location,
      return_location: reservation!.return_location,
      daily_rate: Number(reservation!.daily_rate),
      hourly_rate: (reservation as any)?.hourly_rate != null ? Number((reservation as any).hourly_rate) : undefined,
      duration_hours: (reservation as any)?.total_hours ?? undefined,
      monthly_rate: (reservation as any)?.monthly_rate != null ? Number((reservation as any).monthly_rate) : undefined,
      duration_months: (reservation as any)?.total_months ?? undefined,
      deposit_amount: Number(reservation!.deposit_amount),
      discount_percentage: Number(reservation!.discount_percentage ?? 0),
      additional_fees: Number(reservation!.additional_fees ?? 0),
      payment_method: reservation!.payment_method ?? '',
      fuel_level_pickup: reservation!.fuel_level_pickup ?? '',
      initial_mileage: reservation!.initial_mileage ?? undefined,
      notes: reservation!.notes ?? '',
    } : {
      agency_id: '', vehicle_id: '', client_id: '',
      second_driver_id: '', second_driver_name: '', second_driver_license: '', second_driver_phone: '',
      pickup_date: '', return_date: '',
      pickup_location: '', return_location: '',
      rental_unit: 'day', daily_rate: 0, hourly_rate: undefined, duration_hours: 2,
      monthly_rate: undefined, duration_months: 12,
      deposit_amount: 0, discount_percentage: 0, additional_fees: 0,
      payment_method: '', fuel_level_pickup: '', initial_mileage: undefined,
      notes: '', agent_notes: '',
      initial_paid_amount: 0, initial_payment_method: '',
    },
  });

  const { watch, setValue } = form;
  const vehicleId = isEdit ? reservation!.vehicle?.id : watch('vehicle_id');
  const agencyId = isEdit ? reservation!.agency?.id : watch('agency_id');
  const clientId = isEdit ? reservation!.client?.id : watch('client_id');
  const [pickupDate, returnDate, dailyRate, discountPct, additionalFees, initialPaid, secondDriverId, hourlyRate, durationHours, monthlyRate, durationMonths, rentalUnitField] =
    watch(['pickup_date', 'return_date', 'daily_rate', 'discount_percentage', 'additional_fees', 'initial_paid_amount', 'second_driver_id', 'hourly_rate', 'duration_hours', 'monthly_rate', 'duration_months', 'rental_unit']);
  // Edit mode locks the unit to whatever the reservation was created with —
  // switching units mid-life isn't supported, so there's no toggle there.
  const rentalUnit: 'day' | 'hour' | 'month' = isEdit ? ((reservation as any)?.rental_unit ?? 'day') : (rentalUnitField ?? 'day');

  // The search results above only cover the current search term, so once a
  // client is selected (in either field) it can fall out of that list the
  // next time either field's search text changes — fetch it directly and
  // merge it in so its name keeps showing instead of reverting to the placeholder.
  const { data: selectedClientRes } = useClient(!isEdit && clientId ? clientId : '');
  const { data: selectedSecondDriverRes } = useClient(!isEdit && secondDriverId ? secondDriverId : '');
  const clients = useMemo(() => {
    const base = (clientsRes?.data ?? []).map(toClientOption);
    for (const extra of [selectedClientRes?.data, selectedSecondDriverRes?.data]) {
      if (extra && !base.some(o => o.value === extra.id)) base.unshift(toClientOption(extra));
    }
    return base;
  }, [clientsRes, selectedClientRes, selectedSecondDriverRes]);

  // Auto-fill rate & deposit from selected vehicle (create only)
  useEffect(() => {
    if (isEdit || !vehicleId) return;
    const v = rawVehicles.find(x => x.id === vehicleId);
    if (!v) return;
    if ((v as any).daily_rate) setValue('daily_rate', Number((v as any).daily_rate));
    if ((v as any).deposit_amount) setValue('deposit_amount', Number((v as any).deposit_amount));
    // Only pre-fill when the vehicle has a preset — Horaire/LLD stay selectable
    // either way, the agent just types the rate in manually when there's none.
    setValue('hourly_rate', (v as any).hourly_rate != null ? Number((v as any).hourly_rate) : undefined);
    setValue('monthly_rate', (v as any).monthly_rate != null ? Number((v as any).monthly_rate) : undefined);
  }, [vehicleId, rawVehicles, setValue, isEdit]);

  // Hourly bookings don't let the agent pick a return date directly — it's
  // always derived from pickup_date + the chosen duration in hours.
  useEffect(() => {
    if (rentalUnit !== 'hour' || !pickupDate) return;
    const hours = Math.max(1, Number(durationHours) || 0);
    try {
      const end = new Date(parseISO(pickupDate).getTime() + hours * 60 * 60 * 1000);
      setValue('return_date', format(end, "yyyy-MM-dd'T'HH:mm"));
    } catch { /* invalid pickupDate mid-typing — ignore, retried on next keystroke */ }
  }, [rentalUnit, pickupDate, durationHours, setValue]);

  // Same idea for LLD (month) bookings — the agent picks a number of months,
  // return_date is derived (calendar-aware via date-fns, not a fixed-days
  // approximation, so it lands on the correct day for irregular month lengths).
  useEffect(() => {
    if (rentalUnit !== 'month' || !pickupDate) return;
    const months = Math.max(1, Number(durationMonths) || 0);
    try {
      const end = addMonths(parseISO(pickupDate), months);
      setValue('return_date', format(end, "yyyy-MM-dd'T'HH:mm"));
    } catch { /* invalid pickupDate mid-typing — ignore, retried on next keystroke */ }
  }, [rentalUnit, pickupDate, durationMonths, setValue]);

  // Auto-fill pickup/return location from agency (create only)
  useEffect(() => {
    if (isEdit || !agencyId) return;
    const ag = agenciesRes?.data?.find(x => x.id === agencyId);
    if (!ag) return;
    const loc = `${ag.name}${(ag as any).city ? ' — ' + (ag as any).city : ''}`;
    if (!form.getValues('pickup_location')) setValue('pickup_location', loc);
    if (!form.getValues('return_location')) setValue('return_location', loc);
  }, [agencyId, agenciesRes, setValue, form, isEdit]);

  const selectedVehicle = rawVehicles.find(v => v.id === vehicleId);
  const hasAdblue = (selectedVehicle as any)?.has_adblue === true;
  const depositAmount = watch('deposit_amount');

  useEffect(() => { setConflictDismissed(false); }, [pickupDate, returnDate]);

  // Conflict check (excludes current reservation when editing)
  const canCheckConflict = !!vehicleId && !!pickupDate && !!returnDate && !conflictDismissed;
  const { data: conflictData, isFetching: checkingConflict } = useQuery({
    queryKey: ['reservation-conflict', vehicleId, pickupDate, returnDate, reservation?.id],
    queryFn: () => apiClient.get(apiRoutes.reservationsExt.checkConflict, {
      params: { vehicle_id: vehicleId, pickup_date: pickupDate, return_date: returnDate, exclude_id: reservation?.id },
    }).then(r => r.data?.data),
    enabled: canCheckConflict,
    staleTime: 10_000,
  });
  const hasConflict = !conflictDismissed && conflictData?.has_conflict;

  // Client stats (credit + accidents) — create mode only, since client can't change on edit
  const { data: clientStatsData } = useQuery({
    queryKey: ['client-stats-brief', clientId],
    queryFn: () => apiClient.get(apiRoutes.clientsExt.statistics(clientId!)).then(r => r.data?.data),
    enabled: !isEdit && !!clientId,
  });
  const { data: secondDriverStatsData } = useQuery({
    queryKey: ['client-stats-brief', secondDriverId],
    queryFn: () => apiClient.get(apiRoutes.clientsExt.statistics(secondDriverId!)).then(r => r.data?.data),
    enabled: !isEdit && !!secondDriverId,
  });

  // Financial calculations — mirrors Reservation::calculateTotal() on the
  // backend: hourly reservations bill hourly_rate x whole hours (ceil),
  // daily ones bill daily_rate x whole days (ceil), never mixed.
  const days = useMemo(() => {
    if (rentalUnit !== 'day' || !pickupDate || !returnDate) return 0;
    try {
      const ms = differenceInMilliseconds(parseISO(returnDate), parseISO(pickupDate));
      return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    } catch { return 0; }
  }, [rentalUnit, pickupDate, returnDate]);
  const hours = rentalUnit === 'hour' ? Math.max(1, Number(durationHours) || 0) : 0;
  const months = rentalUnit === 'month' ? Math.max(1, Number(durationMonths) || 0) : 0;
  const subtotal = rentalUnit === 'hour'
    ? Number(hourlyRate ?? 0) * hours
    : rentalUnit === 'month'
      ? Number(monthlyRate ?? 0) * months
      : Number(dailyRate) * days;
  const discount = subtotal * (Number(discountPct ?? 0) / 100);
  const total = subtotal - discount + Number(additionalFees ?? 0);
  const balance = total - Number(initialPaid ?? 0);

  // FIX: previously this used `reservation!.total_amount`, the value stored
  // server-side at creation time, which never changes when the user edits
  // dates/rate/discount/fees in the form — so "Solde restant" appeared frozen.
  // It must be derived from the live recalculated `total` instead, same as
  // the "Total" line above, so it reacts to date/rate/discount/fee changes.
  const existingBalance = isEdit ? total - Number(reservation!.paid_amount) : 0;

  const performUpdate = async (payload: object) => {
    try {
      await updateMutation.mutateAsync(payload as any);
      toast.success('Réservation mise à jour');
      router.push(`/reservations/${reservation!.id}`);
    } catch (err: any) {
      applyServerErrors(err, form, 'Échec de la mise à jour');
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (isEdit) {
      const payload = {
        pickup_date: values.pickup_date,
        return_date: values.return_date,
        pickup_location: values.pickup_location,
        return_location: values.return_location,
        daily_rate: values.daily_rate,
        hourly_rate: rentalUnit === 'hour' ? values.hourly_rate : undefined,
        monthly_rate: rentalUnit === 'month' ? values.monthly_rate : undefined,
        deposit_amount: values.deposit_amount,
        discount_percentage: values.discount_percentage,
        additional_fees: values.additional_fees,
        payment_method: values.payment_method || undefined,
        fuel_level_pickup: values.fuel_level_pickup || undefined,
        initial_mileage: values.initial_mileage,
        notes: values.notes || undefined,
      };

      // Changing any field printed on the contract invalidates it once it's
      // already valid (enforced server-side regardless) — warn before saving
      // so the agent isn't surprised the next time they open the "Contrat PDF" tab.
      const dirty = form.formState.dirtyFields as Record<string, boolean>;
      const willInvalidateContract = reservation?.contract_status === 'valid' &&
        CONTRACT_RELEVANT_EDIT_FIELDS.some((f) => dirty[f]);

      if (willInvalidateContract) {
        setPendingUpdatePayload(payload);
        setConfirmInvalidateOpen(true);
        return;
      }

      await performUpdate(payload);
      return;
    }

    if (values.initial_paid_amount && values.initial_paid_amount > total) {
      form.setError('initial_paid_amount', { message: `Le montant ne peut pas dépasser le total (${total.toLocaleString('fr-MA')} MAD)` });
      return;
    }
    const { initial_paid_amount, initial_payment_method, duration_hours, duration_months, ...rest } = values;
    const payload = {
      ...rest,
      hourly_rate:            rentalUnit === 'hour' ? values.hourly_rate : undefined,
      monthly_rate:           rentalUnit === 'month' ? values.monthly_rate : undefined,
      second_driver_id:      values.second_driver_id || undefined,
      second_driver_name:    values.second_driver_name || undefined,
      second_driver_license: values.second_driver_license || undefined,
      second_driver_phone:   values.second_driver_phone || undefined,
      payment_method:        values.payment_method || undefined,
      fuel_level_pickup:     values.fuel_level_pickup || undefined,
      agent_notes:           values.agent_notes || undefined,
      notes:                 values.notes || undefined,
      // Recorded atomically by the backend as part of reservation creation
      // (gated only by create-reservation) — not a separate payments-endpoint
      // call, which requires the manage-payment permission for anything after.
      initial_paid_amount:     initial_paid_amount && initial_paid_amount > 0 ? initial_paid_amount : undefined,
      initial_payment_method:  initial_paid_amount && initial_paid_amount > 0 ? (initial_payment_method || 'cash') : undefined,
    };
    try {
      const res = await createMutation.mutateAsync(payload as any);
      const newId = (res as any)?.data?.id;
      if (newId && pendingDocs.length > 0) {
        try {
          const formData = new FormData();
          pendingDocs.forEach(d => formData.append('documents[]', d.file));
          pendingDocs.forEach(d => formData.append('names[]', d.title));
          await apiClient.post(apiRoutes.documentsExt.reservation(newId), formData);
        } catch {
          toast.error('Réservation créée mais erreur lors du téléversement des documents');
        }
      }
      toast.success('Réservation créée avec succès');
      router.push('/reservations');
    } catch (err: any) {
      applyServerErrors(err, form, 'Erreur lors de la création');
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
                        onClick={() => router.push(isEdit ? `/reservations/${reservation!.id}` : '/reservations')}>
                  <ArrowLeft className="h-4 w-4" />{isEdit ? reservation!.reference : 'Réservations'}
                </Button>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-lg font-bold">{isEdit ? 'Modifier la réservation' : 'Nouvelle réservation'}</h1>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(isEdit ? `/reservations/${reservation!.id}` : '/reservations')}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending} className="gap-1.5">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isPending ? 'Enregistrement…' : (isEdit ? 'Enregistrer les modifications' : 'Créer la réservation')}
                </Button>
              </div>
            </div>

            {/* Conflict alert — informational only, doesn't block submission */}
            {hasConflict && conflictData?.conflict && (
              <Alert className="border-amber-400 bg-amber-50">
                <CalendarX className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <AlertDescription className="text-amber-800 text-sm">
                  <div className="font-semibold mb-1">Ce véhicule est déjà réservé sur cette période</div>
                  <div>
                    Réservation <span className="font-mono font-bold">{conflictData.conflict.reservation_number}</span>
                    {' '}— statut : <Badge variant="outline" className="text-xs capitalize">{conflictData.conflict.status}</Badge>
                    {conflictData.conflict.client && <> par <span className="font-semibold">{conflictData.conflict.client.full_name}</span> ({conflictData.conflict.client.phone})</>}
                  </div>
                  <div className="text-xs mt-1">
                    Du {formatDT(conflictData.conflict.pickup_date)} au {formatDT(conflictData.conflict.return_date)}
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="mt-1 h-6 text-xs text-amber-700 hover:text-amber-900 p-0" onClick={() => setConflictDismissed(true)}>
                    Masquer
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <div className="lg:col-span-2 space-y-5">

                {/* Intervenants */}
                <SectionCard icon={<User className="h-4 w-4" />} title="Intervenants">
                  {isEdit ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ReadOnlyField label="Agence" value={reservation!.agency?.name} />
                      <ReadOnlyField label="Véhicule" value={reservation!.vehicle?.full_name} sub={reservation!.vehicle?.registration_number} />
                      <ReadOnlyField label="Client" value={reservation!.client?.full_name} sub={reservation!.client?.phone} />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="agency_id" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agence <span className="text-red-500">*</span></FormLabel>
                            <SelectField value={field.value} onChange={field.onChange} placeholder="Sélectionner une agence" options={agencies} />
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Véhicule <span className="text-red-500">*</span></FormLabel>
                            <SelectField value={field.value} onChange={field.onChange} placeholder="Sélectionner un véhicule" options={vehicles} />
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="client_id" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client <span className="text-red-500">*</span></FormLabel>
                            <SelectField value={field.value} onChange={field.onChange} placeholder="Sélectionner un client" options={clients} onSearchChange={setClientSearch} />
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      {clientStatsData && <div className="mt-3"><ClientAlerts stats={clientStatsData} label="Client principal" /></div>}

                      {/* Second driver toggle */}
                      <div className="mt-4">
                        <Button type="button" variant="outline" size="sm" className="gap-1.5"
                                onClick={() => setShowSecondDriver(p => !p)}>
                          {showSecondDriver ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          {showSecondDriver ? 'Supprimer le 2ᵉ conducteur' : 'Ajouter un 2ᵉ conducteur'}
                        </Button>
                      </div>

                      {showSecondDriver && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="second_driver_id" render={({ field }) => (
                              <FormItem>
                                <FormLabel>2ᵉ conducteur (client)</FormLabel>
                                <SelectField value={field.value ?? ''} onChange={field.onChange} placeholder="Client existant (optionnel)" options={clients} onSearchChange={setClientSearch} />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="second_driver_name" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom complet</FormLabel>
                                <FormControl><Input {...field} placeholder="Nom du 2ᵉ conducteur" disabled={!!form.watch('second_driver_id')} /></FormControl>
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
                          {secondDriverStatsData && <ClientAlerts stats={secondDriverStatsData} label="2ᵉ conducteur" />}
                        </div>
                      )}
                    </>
                  )}
                </SectionCard>

                {/* AdBlue / caution alerts */}
                {hasAdblue && (
                  <Alert className="border-blue-300 bg-blue-50">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm font-medium">
                      Ce véhicule est équipé du système <strong>AdBlue</strong>. Informez le client de l'obligation de
                      maintenir le niveau d'urée. En cas de panne, le moteur se bride.
                    </AlertDescription>
                  </Alert>
                )}
                {depositAmount > 0 && (
                  <Alert className="border-amber-300 bg-amber-50">
                    <Coins className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                      <strong>Caution : {Number(depositAmount).toLocaleString('fr-MA')} MAD</strong>
                      <br />Préparer et joindre le document de caution au contrat.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Type de réservation */}
                <SectionCard icon={<CheckCircle2 className="h-4 w-4" />} title="Type de réservation">
                  {isEdit ? (
                    <RentalTypeLocked value={rentalUnit} control={form.control} />
                  ) : !vehicleId ? (
                    <p className="text-sm text-muted-foreground">Sélectionnez d'abord un véhicule pour voir les types de location disponibles.</p>
                  ) : (
                    <RentalTypeSelector
                      value={rentalUnit}
                      onSelect={(v) => setValue('rental_unit', v)}
                      control={form.control}
                    />
                  )}
                </SectionCard>

                {/* Dates & lieux */}
                <SectionCard icon={<Calendar className="h-4 w-4" />} title="Période & localisation">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="pickup_date" render={({ field }) => (
                      <FormItem>
                        <DateTimeField label="Date de départ *" value={field.value ?? ''} onChange={field.onChange} placeholder="Choisir la date de départ" />
                        <FormMessage />
                      </FormItem>
                    )} />
                    {rentalUnit === 'hour' ? (
                      <FormField control={form.control} name="duration_hours" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée *</FormLabel>
                          <div className="flex flex-wrap items-center gap-2">
                            {[2, 4, 6, 8].map((h) => (
                              <Button key={h} type="button" size="sm"
                                      variant={Number(field.value) === h ? 'default' : 'outline'}
                                      onClick={() => field.onChange(h)}>
                                {h}h
                              </Button>
                            ))}
                            <Input type="number" min={1} max={240} className="w-20 h-9" placeholder="Autre"
                                   value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    ) : rentalUnit === 'month' ? (
                      <FormField control={form.control} name="duration_months" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée du contrat *</FormLabel>
                          <div className="flex flex-wrap items-center gap-2">
                            {[6, 12, 24, 36].map((m) => (
                              <Button key={m} type="button" size="sm"
                                      variant={Number(field.value) === m ? 'default' : 'outline'}
                                      onClick={() => field.onChange(m)}>
                                {m} mois
                              </Button>
                            ))}
                            <Input type="number" min={1} max={120} className="w-20 h-9" placeholder="Autre"
                                   value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    ) : (
                      <FormField control={form.control} name="return_date" render={({ field }) => (
                        <FormItem>
                          <DateTimeField label="Date de retour *" value={field.value ?? ''} onChange={field.onChange}
                                         placeholder="Choisir la date de retour"
                                         minDate={pickupDate ? parseISO(pickupDate) : undefined}
                          />
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
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
                  {rentalUnit === 'hour' ? (
                    returnDate && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" />{hours}h — retour le {format(parseISO(returnDate), 'dd/MM/yyyy à HH:mm', { locale: fr })}</Badge>
                        {checkingConflict && <span className="text-xs text-muted-foreground">Vérification des conflits…</span>}
                      </div>
                    )
                  ) : rentalUnit === 'month' ? (
                    returnDate && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" />{months} mois — fin de contrat le {format(parseISO(returnDate), 'dd/MM/yyyy', { locale: fr })}</Badge>
                        {checkingConflict && <span className="text-xs text-muted-foreground">Vérification des conflits…</span>}
                      </div>
                    )
                  ) : days > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" />{days} jour{days > 1 ? 's' : ''}</Badge>
                      {checkingConflict && <span className="text-xs text-muted-foreground">Vérification des conflits…</span>}
                    </div>
                  )}
                </SectionCard>

                {/* Tarification */}
                <SectionCard icon={<CreditCard className="h-4 w-4" />} title="Tarification">
                  <p className="text-xs text-muted-foreground -mt-1 mb-3">
                    Le tarif {rentalUnit === 'hour' ? 'horaire' : rentalUnit === 'month' ? 'mensuel' : 'journalier'} se modifie directement dans la carte « Type de réservation » ci-dessus.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                    {isEdit ? (
                      <ReadOnlyField label="Notes internes (non modifiables ici)" value={(reservation as any)?.agent_notes ?? ''} />
                    ) : (
                      <FormField control={form.control} name="agent_notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes internes</FormLabel>
                          <FormControl><Textarea rows={3} placeholder="Notes confidentielles (agents uniquement)…" className="resize-none" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    )}
                  </div>
                </SectionCard>

                {/* Documents */}
                {isEdit ? (
                  <DocumentsSection
                    title="Documents"
                    entityId={reservation!.id}
                    uploadUrl={apiRoutes.documentsExt.reservation(reservation!.id)}
                    deleteUrlFn={(mediaId) => apiRoutes.documentsExt.mediaDelete.reservation(reservation!.id, mediaId)}
                    initialDocuments={reservation!.documents ?? []}
                    accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
                    titled
                  />
                ) : (
                  <SectionCard icon={<Paperclip className="h-4 w-4" />} title="Documents">
                    <FileUploader
                      value={docFiles}
                      onValueChange={setDocFiles}
                      accept={DOC_ACCEPT}
                      maxSize={DOC_MAX}
                      maxFiles={1}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <Input
                        placeholder="Titre du document (ex. CIN, Permis…)"
                        value={docTitle}
                        onChange={e => setDocTitle(e.target.value)}
                        className="sm:flex-1"
                      />
                      <Button type="button" variant="outline" className="gap-1.5"
                              onClick={addPendingDoc} disabled={!docFile || !docTitle.trim()}>
                        <Plus className="h-4 w-4" />Ajouter à la liste
                      </Button>
                    </div>
                    {pendingDocs.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {pendingDocs.map((d, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{d.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{d.file.name}</div>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50"
                                    onClick={() => removePendingDoc(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                )}
              </div>

              {/* Right sidebar */}
              <div className="space-y-4">
                <Card className="border-2 border-primary/10 sticky top-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {rentalUnit === 'hour'
                          ? `${hours}h × ${Number(hourlyRate ?? 0).toLocaleString('fr-MA')} MAD`
                          : rentalUnit === 'month'
                            ? `${months} mois × ${Number(monthlyRate ?? 0).toLocaleString('fr-MA')} MAD`
                            : `${days}j × ${Number(dailyRate).toLocaleString('fr-MA')} MAD`}
                      </span>
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

                    {isEdit ? (
                      <>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Déjà payé</span>
                          <span className="font-mono">{Number(reservation!.paid_amount).toLocaleString('fr-MA')} MAD</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Solde restant</span>
                          <span className={`font-mono ${existingBalance <= 0 ? 'text-green-700' : 'text-amber-700'}`}>
                            {Math.max(0, existingBalance).toLocaleString('fr-MA')} MAD
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Gérez les paiements depuis la fiche de la réservation.
                        </p>
                      </>
                    ) : (
                      <>
                        <Separator />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paiement à la création</p>
                        <div className="space-y-2">
                          <FormField control={form.control} name="initial_paid_amount" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Montant payé</FormLabel>
                              <FormControl><Input type="number" min={0} max={total || undefined} step={0.01} {...field} value={field.value ?? 0} /></FormControl>
                              <FormMessage />
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
                      </>
                    )}

                    <Button type="submit" className="w-full gap-1.5 mt-2" disabled={isPending}>
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isPending ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Créer la réservation')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </Form>

      <CustomAlertDialog
        title="Cette modification va invalider le contrat"
        description="Le contrat déjà généré pour cette réservation affiche des données (dates, tarif, remise ou frais) qui vont changer. Il sera automatiquement marqué « à régénérer » — vous pourrez le régénérer depuis l'onglet Contrat PDF. Continuer ?"
        confirmText="Enregistrer quand même"
        cancelText="Annuler"
        open={confirmInvalidateOpen}
        setOpen={setConfirmInvalidateOpen}
        onConfirm={() => {
          setConfirmInvalidateOpen(false);
          if (pendingUpdatePayload) performUpdate(pendingUpdatePayload);
        }}
      />
    </PageContainer>
  );
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