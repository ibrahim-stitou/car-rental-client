'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import type { RentalConditions, Translatable } from '@/types/website.types';
import { useRentalConditions, useUpdateRentalConditions } from '../hooks/use-website';
import { cleanTranslatable, toastWebsiteError } from '../utils';
import { TranslatableField } from './translatable-field';

const schema = z.object({
  min_driver_age: z.coerce.number().int().min(18, '18 ans minimum').max(99),
  min_license_years: z.coerce.number().int().min(0).max(50),
  default_deposit_amount: z.coerce.number().int().min(0),
  mileage_policy: z.enum(['unlimited', 'limited']),
  mileage_limit_per_day: z.coerce.number().int().min(0).nullable(),
  required_documents: z.record(z.string().nullable()),
  fuel_policy: z.record(z.string().nullable()),
  additional_terms: z.record(z.string().nullable()),
}).refine((v) => v.mileage_policy !== 'limited' || (v.mileage_limit_per_day ?? 0) > 0, {
  path: ['mileage_limit_per_day'], message: 'Indiquez le kilométrage inclus par jour',
});

type FormValues = z.infer<typeof schema>;

export function WebsiteConditionsView() {
  const { data: res, isLoading } = useRentalConditions();
  const updateMutation = useUpdateRentalConditions();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { register, control, handleSubmit, reset, watch, formState: { errors, isDirty } } = form;

  useEffect(() => {
    const c = res?.data;
    if (!c) return;
    reset({
      min_driver_age: c.min_driver_age,
      min_license_years: c.min_license_years,
      default_deposit_amount: c.default_deposit_amount,
      mileage_policy: c.mileage_policy ?? 'unlimited',
      mileage_limit_per_day: c.mileage_limit_per_day ?? 0,
      required_documents: c.required_documents ?? {},
      fuel_policy: c.fuel_policy ?? {},
      additional_terms: c.additional_terms ?? {},
    });
  }, [res, reset]);

  const onSubmit = (v: FormValues) => {
    const payload: Partial<RentalConditions> = {
      ...v,
      mileage_limit_per_day: v.mileage_policy === 'limited' ? v.mileage_limit_per_day : 0,
      required_documents: cleanTranslatable(v.required_documents as Translatable),
      fuel_policy: cleanTranslatable(v.fuel_policy as Translatable),
      additional_terms: cleanTranslatable(v.additional_terms as Translatable),
    };
    updateMutation.mutate(payload, {
      onSuccess: (r) => toast.success(r.message ?? 'Conditions enregistrées'),
      onError: (err) => toastWebsiteError(err, "Échec de l'enregistrement"),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Conditions de location"
        description="Conditions générales affichées sur le site. Chaque véhicule peut les remplacer dans sa fiche web."
        actions={
          <Button type="submit" size="sm" disabled={updateMutation.isPending || !isDirty}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Enregistrer
          </Button>
        }
      />

      {isLoading ? <Skeleton className="h-96" /> : (
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          <Card>
            <CardHeader><CardTitle className="text-base">Conducteur, caution et kilométrage</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Âge minimum du conducteur</Label>
                <Input type="number" {...register('min_driver_age')} />
                {errors.min_driver_age && <p className="text-sm text-destructive">{errors.min_driver_age.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Ancienneté du permis (ans)</Label>
                <Input type="number" {...register('min_license_years')} />
              </div>
              <div className="space-y-1.5">
                <Label>Caution par défaut (MAD)</Label>
                <Input type="number" {...register('default_deposit_amount')} />
              </div>
              <div className="space-y-1.5">
                <Label>Kilométrage</Label>
                <Controller control={control} name="mileage_policy" render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => { /* Radix emits '' on mount inside a form */ if (v) field.onChange(v); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited">Illimité</SelectItem>
                      <SelectItem value="limited">Limité</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              {watch('mileage_policy') === 'limited' && (
                <div className="space-y-1.5">
                  <Label>Km inclus par jour</Label>
                  <Input type="number" {...register('mileage_limit_per_day')} />
                  {errors.mileage_limit_per_day && <p className="text-sm text-destructive">{errors.mileage_limit_per_day.message}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Textes</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <Controller control={control} name="required_documents" render={({ field }) => (
                <TranslatableField label="Documents requis" value={field.value} onChange={field.onChange} multiline rows={2} maxLength={2000} />
              )} />
              <Controller control={control} name="fuel_policy" render={({ field }) => (
                <TranslatableField label="Politique carburant" value={field.value} onChange={field.onChange} multiline rows={2} maxLength={2000} />
              )} />
              <Controller control={control} name="additional_terms" render={({ field }) => (
                <TranslatableField label="Conditions complémentaires" value={field.value} onChange={field.onChange} multiline rows={4} maxLength={5000} />
              )} />
            </CardContent>
          </Card>
        </div>
      )}
    </form>
  );
}
