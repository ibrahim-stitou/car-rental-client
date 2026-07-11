'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useCreateVignette, useUpdateVignette } from '../hooks/use-vignettes';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import type { Vignette } from '@/types/vignette.types';
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
import { VIGNETTE_PAYMENT_METHOD_OPTIONS } from '@/config/constants';

const schema = z.object({
  vehicle_id: z.string().min(1, 'Véhicule requis'),
  year: z.coerce.number().min(2000).max(new Date().getFullYear() + 2),
  issue_date: z.string().min(1, "Date d'émission requise"),
  expiry_date: z.string().min(1, "Date d'expiration requise"),
  amount: z.coerce.number().min(0),
  payment_method: z.string().optional(),
  payment_reference: z.string().optional(),
  agent_notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  vehicle_id: '', year: new Date().getFullYear(), issue_date: '', expiry_date: '',
  amount: 0, payment_method: '', payment_reference: '', agent_notes: '',
};

interface Props {
  vignette?: Vignette | null;
}

export function VignetteFormView({ vignette }: Props) {
  const router = useRouter();
  const createMutation = useCreateVignette();
  const updateMutation = useUpdateVignette(vignette?.id ?? '');
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const vehicles = vehiclesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues });

  useEffect(() => {
    if (vignette) {
      form.reset({
        vehicle_id: vignette.vehicle_id,
        year: vignette.year,
        issue_date: vignette.issue_date,
        expiry_date: vignette.expiry_date,
        amount: Number(vignette.amount),
        payment_method: vignette.payment_method ?? '',
        payment_reference: vignette.payment_reference ?? '',
        agent_notes: vignette.agent_notes ?? '',
      });
    } else {
      form.reset(emptyValues);
    }
  }, [vignette, form]);

  const onSubmit = (values: FormValues) => {
    const payload = { ...values, payment_method: values.payment_method || undefined };
    if (vignette) {
      updateMutation.mutate(payload as any, {
        onSuccess: () => { toast.success('Vignette mise à jour'); router.push(`/vignettes/${vignette.id}`); },
        onError: (err) => applyServerErrors(err, form, 'Échec de la mise à jour'),
      });
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: (res) => { toast.success('Vignette créée'); router.push(`/vignettes/${(res as any)?.data?.id}`); },
        onError: (err) => applyServerErrors(err, form, 'Impossible de créer la vignette'),
      });
    }
  };

  return (
    <PageContainer scrollable>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 w-full">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground"
                onClick={() => router.push('/vignettes')}>
                <ArrowLeft className="h-4 w-4" />Vignettes
              </Button>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-lg font-bold">{vignette ? 'Modifier la vignette' : 'Nouvelle vignette'}</h1>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/vignettes')}>Annuler</Button>
              <Button type="submit" disabled={isPending} className="gap-1.5">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isPending ? 'Enregistrement…' : vignette ? 'Mettre à jour' : 'Créer'}
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
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Année *</FormLabel><FormControl><Input type="number" min={2000} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Montant (MAD) *</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="issue_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'émission *</FormLabel>
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

              <FormField control={form.control} name="payment_method" render={({ field }) => (
                <FormItem><FormLabel>Mode de paiement</FormLabel>
                  <Select
                    value={field.value || '__none__'}
                    onValueChange={v => field.onChange(v === '__none__' ? undefined : v)}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Si déjà payée" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Non payée</SelectItem>
                      {VIGNETTE_PAYMENT_METHOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="payment_reference" render={({ field }) => (
                <FormItem><FormLabel>Référence de paiement</FormLabel><FormControl><Input placeholder="Numéro de reçu ou transaction" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="agent_notes" render={({ field }) => (
                <FormItem><FormLabel>Commentaire</FormLabel><FormControl><Textarea rows={3} placeholder="Remarques…" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {!vignette && (
            <p className="text-xs text-muted-foreground">
              Vous pourrez ajouter les documents une fois la vignette créée.
            </p>
          )}
        </form>
      </Form>
    </PageContainer>
  );
}
