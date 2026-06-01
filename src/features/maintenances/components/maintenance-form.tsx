'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateMaintenance, useUpdateMaintenance } from '../hooks/use-maintenances';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import type { Maintenance } from '@/types/maintenance.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MAINTENANCE_STATUS_OPTIONS, MAINTENANCE_PRIORITY_OPTIONS, MAINTENANCE_TYPE_OPTIONS } from '@/config/constants';

const schema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().min(1, 'Description is required'),
  maintenance_date: z.string().min(1, 'Date is required'),
  mileage_at_service: z.coerce.number().optional(),
  next_service_mileage: z.coerce.number().optional(),
  next_service_date: z.string().optional(),
  cost: z.coerce.number().min(0),
  service_provider: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance?: Maintenance | null;
  onSuccess?: () => void;
}

export function MaintenanceForm({ open, onOpenChange, maintenance, onSuccess }: Props) {
  const createMutation = useCreateMaintenance();
  const updateMutation = useUpdateMaintenance(maintenance?.id ?? '');
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const vehicles = vehiclesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_id: '', type: '', description: '', maintenance_date: '', mileage_at_service: undefined, next_service_mileage: undefined, next_service_date: '', cost: 0, service_provider: '', status: 'scheduled', priority: 'medium', notes: '' },
  });

  useEffect(() => {
    if (maintenance) {
      form.reset({
        vehicle_id: maintenance.vehicle_id,
        type: maintenance.type,
        description: maintenance.description,
        maintenance_date: maintenance.maintenance_date,
        mileage_at_service: maintenance.mileage_at_service ?? undefined,
        next_service_mileage: maintenance.next_service_mileage ?? undefined,
        next_service_date: maintenance.next_service_date ?? '',
        cost: Number(maintenance.cost),
        service_provider: maintenance.service_provider ?? '',
        status: maintenance.status,
        priority: maintenance.priority,
        notes: maintenance.notes ?? '',
      });
    } else {
      form.reset({ vehicle_id: '', type: '', description: '', maintenance_date: '', mileage_at_service: undefined, next_service_mileage: undefined, next_service_date: '', cost: 0, service_provider: '', status: 'scheduled', priority: 'medium', notes: '' });
    }
  }, [maintenance, form, open]);

  const onSubmit = (values: FormValues) => {
    const payload = { ...values } as any;
    if (maintenance) {
      updateMutation.mutate(payload, {
        onSuccess: () => { toast.success('Maintenance mise à jour'); onOpenChange(false); onSuccess?.(); },
        onError: () => toast.error('Échec de la mise à jour maintenance'),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success('Maintenance créée'); onOpenChange(false); form.reset(); onSuccess?.(); },
        onError: () => toast.error('Impossible de créer maintenance'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{maintenance ? 'Modifier la maintenance' : 'Ajouter une maintenance'}</SheetTitle>
          <SheetDescription>{maintenance ? 'Mettre à jour le dossier de maintenance' : 'Enregistrer une nouvelle maintenance'}</SheetDescription>
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
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>{MAINTENANCE_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="maintenance_date" render={({ field }) => (
                  <FormItem><FormLabel>Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description *</FormLabel><FormControl><Textarea rows={2} placeholder="Describe the maintenance work…" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Statut *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{MAINTENANCE_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem><FormLabel>Priorité *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{MAINTENANCE_PRIORITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem><FormLabel>Coût (MAD) *</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="service_provider" render={({ field }) => (
                  <FormItem><FormLabel>Prestataire</FormLabel><FormControl><Input placeholder="Nom du garage" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Prochaine révision</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="mileage_at_service" render={({ field }) => (
                  <FormItem><FormLabel>Kilométrage à la révision (km)</FormLabel><FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="next_service_mileage" render={({ field }) => (
                  <FormItem><FormLabel>Km prochaine révision</FormLabel><FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="next_service_date" render={({ field }) => (
                <FormItem><FormLabel>Date prochaine révision</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Remarques</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : maintenance ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
