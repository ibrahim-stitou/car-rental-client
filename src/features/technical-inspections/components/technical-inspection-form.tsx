'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateTechnicalInspection, useUpdateTechnicalInspection } from '../hooks/use-technical-inspections';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import type { TechnicalInspection } from '@/types/technical-inspection.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { INSPECTION_RESULT_OPTIONS } from '@/config/constants';

const schema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  inspection_date: z.string().min(1, 'Inspection date is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  result: z.enum(['passed', 'failed', 'pending']),
  inspection_center: z.string().optional(),
  inspector_name: z.string().optional(),
  observations: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  next_inspection_date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection?: TechnicalInspection | null;
  onSuccess?: () => void;
}

export function TechnicalInspectionForm({ open, onOpenChange, inspection, onSuccess }: Props) {
  const createMutation = useCreateTechnicalInspection();
  const updateMutation = useUpdateTechnicalInspection(inspection?.id ?? '');
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const vehicles = vehiclesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_id: '', inspection_date: '', expiry_date: '', result: 'pending', inspection_center: '', inspector_name: '', observations: '', cost: undefined, next_inspection_date: '' },
  });

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
      form.reset({ vehicle_id: '', inspection_date: '', expiry_date: '', result: 'pending', inspection_center: '', inspector_name: '', observations: '', cost: undefined, next_inspection_date: '' });
    }
  }, [inspection, form, open]);

  const onSubmit = (values: FormValues) => {
    const payload = { ...values } as any;
    if (inspection) {
      updateMutation.mutate(payload, {
        onSuccess: () => { toast.success('Visite mise à jour'); onOpenChange(false); onSuccess?.(); },
        onError: () => toast.error('Échec de la mise à jour inspection'),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success('Visite créée'); onOpenChange(false); form.reset(); onSuccess?.(); },
        onError: () => toast.error('Impossible de créer inspection'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{inspection ? 'Modifier la visite' : 'Ajouter une visite'}</SheetTitle>
          <SheetDescription>{inspection ? 'Mettre à jour la visite technique' : 'Enregistrer une visite technique'}</SheetDescription>
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
                <FormField control={form.control} name="inspection_date" render={({ field }) => (
                  <FormItem><FormLabel>Date de visite *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="expiry_date" render={({ field }) => (
                  <FormItem><FormLabel>Date d'expiration *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="result" render={({ field }) => (
                  <FormItem><FormLabel>Résultat *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{INSPECTION_RESULT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem><FormLabel>Coût (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="inspection_center" render={({ field }) => (
                  <FormItem><FormLabel>Centre de contrôle</FormLabel><FormControl><Input placeholder="Centre Technique X" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="inspector_name" render={({ field }) => (
                  <FormItem><FormLabel>Nom du contrôleur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="next_inspection_date" render={({ field }) => (
                <FormItem><FormLabel>Prochaine visite</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="observations" render={({ field }) => (
                <FormItem><FormLabel>Observations</FormLabel><FormControl><Textarea rows={2} placeholder="Observations du contrôleur…" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : inspection ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
