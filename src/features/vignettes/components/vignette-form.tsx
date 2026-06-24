'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateVignette, useUpdateVignette } from '../hooks/use-vignettes';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import type { Vignette } from '@/types/vignette.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VIGNETTE_PAYMENT_METHOD_OPTIONS } from '@/config/constants';

const schema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  year: z.coerce.number().min(2000).max(new Date().getFullYear() + 2),
  issue_date: z.string().min(1, 'Issue date is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  amount: z.coerce.number().min(0),
  payment_method: z.string().optional(),
  payment_reference: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vignette?: Vignette | null;
  onSuccess?: () => void;
}

export function VignetteForm({ open, onOpenChange, vignette, onSuccess }: Props) {
  const createMutation = useCreateVignette();
  const updateMutation = useUpdateVignette(vignette?.id ?? '');
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const vehicles = vehiclesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_id: '', year: new Date().getFullYear(), issue_date: '', expiry_date: '', amount: 0, payment_method: '', payment_reference: '' },
  });

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
      });
    } else {
      form.reset({ vehicle_id: '', year: new Date().getFullYear(), issue_date: '', expiry_date: '', amount: 0, payment_method: '', payment_reference: '' });
    }
  }, [vignette, form, open]);

  const onSubmit = (values: FormValues) => {
    const payload = { ...values, payment_method: values.payment_method || undefined } as any;
    if (vignette) {
      updateMutation.mutate(payload, {
        onSuccess: () => { toast.success('Vignette mise à jour'); onOpenChange(false); onSuccess?.(); },
        onError: () => toast.error('Échec de la mise à jour vignette'),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success('Vignette créée'); onOpenChange(false); form.reset(); onSuccess?.(); },
        onError: () => toast.error('Impossible de créer vignette'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{vignette ? 'Modifier la vignette' : 'Ajouter une vignette'}</SheetTitle>
          <SheetDescription>{vignette ? 'Mettre à jour la vignette' : 'Enregistrer une nouvelle vignette'}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                <FormItem><FormLabel>Véhicule *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un véhicule" /></SelectTrigger></FormControl>
                    <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} — {v.registration_number}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Année *</FormLabel><FormControl><Input type="number" min={2000} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Montant (MAD) *</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="issue_date" render={({ field }) => (
                  <FormItem><FormLabel>Date d'émission *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="expiry_date" render={({ field }) => (
                  <FormItem><FormLabel>Date d'expiration *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
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

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : vignette ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
