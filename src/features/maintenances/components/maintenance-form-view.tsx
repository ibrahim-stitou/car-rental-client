'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useCreateMaintenance, useUpdateMaintenance } from '../hooks/use-maintenances';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import type { Maintenance } from '@/types/maintenance.types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SelectField } from '@/components/shared/select-field';
import { FormDatePicker } from '@/components/shared/form-date-picker';
import PageContainer from '@/components/layout/page-container';
import { applyServerErrors } from '@/lib/form-errors';
import {
  MAINTENANCE_STATUS_OPTIONS, MAINTENANCE_PRIORITY_OPTIONS, MAINTENANCE_TYPE_OPTIONS,
  MAINTENANCE_SUB_TYPE_OPTIONS, TIRE_POSITION_OPTIONS,
} from '@/config/constants';
import { IconDroplet, IconCircleDot } from '@tabler/icons-react';

const schema = z.object({
  vehicle_id:            z.string().min(1, 'Véhicule requis'),
  title:                 z.string().optional(),
  type:                  z.string().min(1, 'Type requis'),
  sub_type:              z.string().optional(),
  description:           z.string().min(1, 'Description requise'),
  agent_notes:           z.string().optional(),
  maintenance_date:      z.string().min(1, 'Date requise'),
  mileage_at_service:    z.coerce.number().optional(),
  next_service_mileage:  z.coerce.number().optional(),
  next_oil_change_mileage: z.coerce.number().optional(),
  tire_position:         z.string().optional(),
  next_service_date:     z.string().optional(),
  cost:                  z.coerce.number().min(0),
  actual_cost:           z.coerce.number().optional(),
  service_provider:      z.string().optional(),
  status:                z.string().min(1),
  priority:              z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  vehicle_id: '', title: '', type: '', sub_type: '',
  description: '', agent_notes: '', maintenance_date: '',
  mileage_at_service: undefined, next_service_mileage: undefined,
  next_oil_change_mileage: undefined, tire_position: '',
  next_service_date: '', cost: 0, actual_cost: undefined,
  service_provider: '', status: 'scheduled', priority: 'medium',
};

interface Props {
  maintenance?: Maintenance | null;
}

export function MaintenanceFormView({ maintenance }: Props) {
  const router = useRouter();
  const createMutation = useCreateMaintenance();
  const updateMutation = useUpdateMaintenance(maintenance?.id ?? '');
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const vehicles = vehiclesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues });

  useEffect(() => {
    if (maintenance) {
      form.reset({
        vehicle_id: maintenance.vehicle_id,
        title: (maintenance as any).title ?? '',
        type: maintenance.type,
        sub_type: (maintenance as any).sub_type ?? '',
        description: maintenance.description,
        agent_notes: (maintenance as any).agent_notes ?? '',
        maintenance_date: maintenance.maintenance_date,
        mileage_at_service: maintenance.mileage_at_service ?? undefined,
        next_service_mileage: maintenance.next_service_mileage ?? undefined,
        next_oil_change_mileage: (maintenance as any).next_oil_change_mileage ?? undefined,
        tire_position: (maintenance as any).tire_position ?? '',
        next_service_date: maintenance.next_service_date ?? '',
        cost: Number(maintenance.cost),
        actual_cost: (maintenance as any).actual_cost ? Number((maintenance as any).actual_cost) : undefined,
        service_provider: maintenance.service_provider ?? '',
        status: maintenance.status,
        priority: maintenance.priority,
      });
    } else {
      form.reset(emptyValues);
    }
  }, [maintenance, form]);

  const subType = form.watch('sub_type');
  const isOilChange = subType === 'oil_change';
  const isTireChange = subType === 'tire_change';

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      sub_type: values.sub_type || undefined,
      tire_position: values.tire_position || undefined,
      next_service_date: values.next_service_date || undefined,
    } as any;
    if (maintenance) {
      updateMutation.mutate(payload, {
        onSuccess: () => { toast.success('Maintenance mise à jour'); router.push(`/maintenances/${maintenance.id}`); },
        onError: (err) => applyServerErrors(err, form, 'Échec de la mise à jour'),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (res) => { toast.success('Maintenance créée'); router.push(`/maintenances/${(res as any)?.data?.id}`); },
        onError: (err) => applyServerErrors(err, form, 'Impossible de créer la maintenance'),
      });
    }
  };

  return (
    <PageContainer scrollable>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 max-w-3xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground"
                onClick={() => router.push('/maintenances')}>
                <ArrowLeft className="h-4 w-4" />Maintenances
              </Button>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-lg font-bold">{maintenance ? 'Modifier la maintenance' : 'Nouvelle maintenance'}</h1>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/maintenances')}>Annuler</Button>
              <Button type="submit" disabled={isPending} className="gap-1.5">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isPending ? 'Enregistrement…' : maintenance ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Informations générales</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Véhicule *</FormLabel>
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sélectionner un véhicule"
                    options={vehicles.map(v => ({ value: v.id, label: `${v.brand} ${v.model}`, sub: v.registration_number }))}
                  />
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Titre</FormLabel><FormControl><Input placeholder="Ex: Vidange 80 000 km" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                      <SelectContent>{MAINTENANCE_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="sub_type" render={({ field }) => (
                  <FormItem><FormLabel>Sous-type</FormLabel>
                    <Select
                      value={field.value || '__none__'}
                      onValueChange={v => field.onChange(v === '__none__' ? '' : v)}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">— Aucun —</SelectItem>
                        {MAINTENANCE_SUB_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>

              {isOilChange && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <IconDroplet className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    <strong>Vidange</strong> — Renseignez le prochain kilométrage de vidange pour activer les alertes automatiques.
                  </AlertDescription>
                </Alert>
              )}

              {isTireChange && (
                <>
                  <Alert className="border-blue-200 bg-blue-50">
                    <IconCircleDot className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      <strong>Changement de pneus</strong> — Précisez la position des pneus changés.
                    </AlertDescription>
                  </Alert>
                  <FormField control={form.control} name="tire_position" render={({ field }) => (
                    <FormItem><FormLabel>Position des pneus</FormLabel>
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                        <SelectContent>{TIRE_POSITION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </>
              )}

              <FormField control={form.control} name="maintenance_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormDatePicker value={field.value} onChange={field.onChange} placeholder="Choisir la date" />
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description *</FormLabel><FormControl><Textarea rows={3} placeholder="Travaux effectués…" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Statut *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{MAINTENANCE_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem><FormLabel>Priorité *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{MAINTENANCE_PRIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem><FormLabel>Coût estimé (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="actual_cost" render={({ field }) => (
                  <FormItem><FormLabel>Coût réel (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} value={field.value ?? ''} placeholder="Après intervention" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="service_provider" render={({ field }) => (
                <FormItem><FormLabel>Prestataire</FormLabel><FormControl><Input placeholder="Nom du garage" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Kilométrage & Prochaine révision</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="mileage_at_service" render={({ field }) => (
                  <FormItem><FormLabel>Km à l'intervention</FormLabel><FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="next_service_mileage" render={({ field }) => (
                  <FormItem><FormLabel>Km prochaine révision</FormLabel><FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              {isOilChange && (
                <FormField control={form.control} name="next_oil_change_mileage" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-yellow-700 font-semibold">Km prochaine VIDANGE</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} placeholder="Ex: 85000" className="border-yellow-300 focus-visible:ring-yellow-400" /></FormControl>
                    <p className="text-xs text-yellow-600">Alerte à 500km et 100km avant. Affichage rouge après dépassement.</p>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="next_service_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date prochaine révision</FormLabel>
                  <FormDatePicker value={field.value} onChange={field.onChange} placeholder="Choisir la date (optionnel)" />
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="agent_notes" render={({ field }) => (
                <FormItem><FormLabel>Commentaire</FormLabel><FormControl><Textarea rows={3} placeholder="Observations, remarques…" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {!maintenance && (
            <p className="text-xs text-muted-foreground">
              Vous pourrez ajouter les factures et photos une fois la maintenance créée.
            </p>
          )}
        </form>
      </Form>
    </PageContainer>
  );
}
