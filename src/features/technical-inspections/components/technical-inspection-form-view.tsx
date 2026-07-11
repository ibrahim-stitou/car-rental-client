'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useCreateTechnicalInspection, useUpdateTechnicalInspection } from '../hooks/use-technical-inspections';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import { useParameterOptions, useCreateParameter } from '@/features/settings/hooks/use-parameters';
import type { TechnicalInspection } from '@/types/technical-inspection.types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectField } from '@/components/shared/select-field';
import { FormDatePicker } from '@/components/shared/form-date-picker';
import PageContainer from '@/components/layout/page-container';
import { applyServerErrors } from '@/lib/form-errors';
import { INSPECTION_RESULT_OPTIONS } from '@/config/constants';

const schema = z.object({
  vehicle_id: z.string().min(1, 'Véhicule requis'),
  inspection_date: z.string().min(1, 'Date de visite requise'),
  expiry_date: z.string().min(1, "Date d'expiration requise"),
  result: z.enum(['passed', 'failed', 'pending']),
  inspection_center: z.string().min(1, 'Centre de contrôle requis'),
  inspector_name: z.string().optional(),
  observations: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  next_inspection_date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  vehicle_id: '', inspection_date: '', expiry_date: '', result: 'pending',
  inspection_center: '', inspector_name: '', observations: '', cost: undefined, next_inspection_date: '',
};

interface Props {
  inspection?: TechnicalInspection | null;
}

export function TechnicalInspectionFormView({ inspection }: Props) {
  const router = useRouter();
  const createMutation = useCreateTechnicalInspection();
  const updateMutation = useUpdateTechnicalInspection(inspection?.id ?? '');
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const vehicles = vehiclesRes?.data ?? [];
  const { options: centerOptions } = useParameterOptions('inspection_center');
  const createParameter = useCreateParameter();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues });

  useEffect(() => {
    if (inspection) {
      form.reset({
        vehicle_id: inspection.vehicle_id,
        inspection_date: inspection.inspection_date,
        expiry_date: inspection.expiry_date,
        result: inspection.result,
        inspection_center: inspection.inspection_center ?? '',
        inspector_name: inspection.inspector_name ?? '',
        observations: inspection.observations ?? '',
        cost: inspection.cost ?? undefined,
        next_inspection_date: inspection.next_inspection_date ?? '',
      });
    } else {
      form.reset(emptyValues);
    }
  }, [inspection, form]);

  const onSubmit = (values: FormValues) => {
    if (inspection) {
      updateMutation.mutate(values as any, {
        onSuccess: () => { toast.success('Visite technique mise à jour'); router.push(`/technical-inspections/${inspection.id}`); },
        onError: (err) => applyServerErrors(err, form, 'Échec de la mise à jour'),
      });
    } else {
      createMutation.mutate(values as any, {
        onSuccess: (res) => { toast.success('Visite technique créée'); router.push(`/technical-inspections/${(res as any)?.data?.id}`); },
        onError: (err) => applyServerErrors(err, form, 'Impossible de créer la visite technique'),
      });
    }
  };

  const handleCreateCenter = (label: string) => {
    createParameter.mutate(
      { category: 'inspection_center', value: label, label },
      {
        onSuccess: () => { form.setValue('inspection_center', label); toast.success('Centre ajouté aux paramètres'); },
        onError: () => { form.setValue('inspection_center', label); },
      }
    );
  };

  return (
    <PageContainer scrollable>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 w-full">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground"
                onClick={() => router.push('/technical-inspections')}>
                <ArrowLeft className="h-4 w-4" />Visites techniques
              </Button>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-lg font-bold">{inspection ? 'Modifier la visite' : 'Nouvelle visite technique'}</h1>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/technical-inspections')}>Annuler</Button>
              <Button type="submit" disabled={isPending} className="gap-1.5">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isPending ? 'Enregistrement…' : inspection ? 'Mettre à jour' : 'Créer'}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="inspection_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de visite *</FormLabel>
                    <FormDatePicker value={field.value} onChange={field.onChange} placeholder="Choisir la date" />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="expiry_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'expiration *</FormLabel>
                    <FormDatePicker value={field.value} onChange={field.onChange} placeholder="Choisir la date" />
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="result" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Résultat *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{INSPECTION_RESULT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem><FormLabel>Coût (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="inspection_center" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centre de contrôle *</FormLabel>
                    <SelectField
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Sélectionner un centre"
                      options={centerOptions}
                      onCreateNew={handleCreateCenter}
                    />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="inspector_name" render={({ field }) => (
                  <FormItem><FormLabel>Nom du contrôleur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="next_inspection_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Prochaine visite</FormLabel>
                  <FormDatePicker value={field.value} onChange={field.onChange} placeholder="Choisir la date (optionnel)" />
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="observations" render={({ field }) => (
                <FormItem><FormLabel>Commentaire</FormLabel><FormControl><Textarea rows={3} placeholder="Observations du contrôleur…" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {!inspection && (
            <p className="text-xs text-muted-foreground">
              Vous pourrez ajouter le rapport et les photos une fois la visite créée.
            </p>
          )}
        </form>
      </Form>
    </PageContainer>
  );
}
