'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateInsurance, useUpdateInsurance } from '../hooks/use-insurances';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import type { Insurance } from '@/types/insurance.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { INSURANCE_TYPE_OPTIONS } from '@/config/constants';

const schema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  insurance_company: z.string().min(1, 'Insurance company is required'),
  policy_number: z.string().min(1, 'Policy number is required'),
  type: z.enum(['third_party', 'comprehensive', 'all_risk']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  premium_amount: z.coerce.number().min(0),
  deductible_amount: z.coerce.number().min(0).optional(),
  agent_name: z.string().optional(),
  agent_phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insurance?: Insurance | null;
  onSuccess?: () => void;
}

export function InsuranceForm({ open, onOpenChange, insurance, onSuccess }: Props) {
  const createMutation = useCreateInsurance();
  const updateMutation = useUpdateInsurance(insurance?.id ?? '');
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const vehicles = vehiclesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_id: '', insurance_company: '', policy_number: '', type: 'third_party', start_date: '', end_date: '', premium_amount: 0, deductible_amount: 0, agent_name: '', agent_phone: '', notes: '' },
  });

  useEffect(() => {
    if (insurance) {
      form.reset({
        vehicle_id: insurance.vehicle_id,
        insurance_company: insurance.insurance_company,
        policy_number: insurance.policy_number,
        type: insurance.type,
        start_date: insurance.start_date,
        end_date: insurance.end_date,
        premium_amount: Number(insurance.premium_amount),
        deductible_amount: Number(insurance.deductible_amount),
        agent_name: insurance.agent_name ?? '',
        agent_phone: insurance.agent_phone ?? '',
        notes: insurance.notes ?? '',
      });
    } else {
      form.reset({ vehicle_id: '', insurance_company: '', policy_number: '', type: 'third_party', start_date: '', end_date: '', premium_amount: 0, deductible_amount: 0, agent_name: '', agent_phone: '', notes: '' });
    }
  }, [insurance, form, open]);

  const onSubmit = (values: FormValues) => {
    const payload = { ...values } as any;
    if (insurance) {
      updateMutation.mutate(payload, {
        onSuccess: () => { toast.success('Assurance mise à jour'); onOpenChange(false); onSuccess?.(); },
        onError: () => toast.error('Échec de la mise à jour insurance'),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success('Assurance créée'); onOpenChange(false); form.reset(); onSuccess?.(); },
        onError: () => toast.error('Impossible de créer insurance'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{insurance ? "Modifier l'assurance" : 'Ajouter une assurance'}</SheetTitle>
          <SheetDescription>{insurance ? "Mettre à jour la police d'assurance" : "Enregistrer une nouvelle police d'assurance"}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                <FormItem><FormLabel>Véhicule *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un véhicule" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} — {v.registration_number}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="insurance_company" render={({ field }) => (
                  <FormItem><FormLabel>Compagnie d'assurance *</FormLabel><FormControl><Input placeholder="Wafa Assurance" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="policy_number" render={({ field }) => (
                  <FormItem><FormLabel>N° de police *</FormLabel><FormControl><Input placeholder="POL-12345" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{INSURANCE_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="start_date" render={({ field }) => (
                  <FormItem><FormLabel>Date de début *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="end_date" render={({ field }) => (
                  <FormItem><FormLabel>Date de fin *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="premium_amount" render={({ field }) => (
                  <FormItem><FormLabel>Prime (MAD) *</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="deductible_amount" render={({ field }) => (
                  <FormItem><FormLabel>Franchise (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Contact agent</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="agent_name" render={({ field }) => (
                  <FormItem><FormLabel>Nom de l'agent</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="agent_phone" render={({ field }) => (
                  <FormItem><FormLabel>Téléphone agent</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Remarques</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : insurance ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
