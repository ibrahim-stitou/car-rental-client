'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateExpense, useUpdateExpense } from '../hooks/use-expenses';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import type { Expense, UpdateExpenseInput } from '@/types/expense.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: 'Carburant' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'insurance', label: 'Assurance' },
  { value: 'vignette', label: 'Vignette' },
  { value: 'inspection', label: 'Contrôle technique' },
  { value: 'repair', label: 'Réparation' },
  { value: 'cleaning', label: 'Nettoyage' },
  { value: 'administrative', label: 'Administratif' },
  { value: 'salary', label: 'Salaire' },
  { value: 'rent', label: 'Loyer' },
  { value: 'utilities', label: 'Charges' },
  { value: 'other', label: 'Autre' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'bank_transfer', label: 'Virement' },
  { value: 'check', label: 'Chèque' },
  { value: 'online', label: 'En ligne' },
];

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  category: z.string().min(1, 'Catégorie requise'),
  amount: z.coerce.number().min(0.01, 'Montant requis'),
  expense_date: z.string().min(1, 'Date requise'),
  agency_id: z.string().optional(),
  vehicle_id: z.string().optional(),
  payment_method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  defaultAgencyId?: string;
  defaultVehicleId?: string;
  onSuccess?: () => void;
}

export function ExpenseForm({ open, onOpenChange, expense, defaultAgencyId, defaultVehicleId, onSuccess }: Props) {
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense(expense?.id ?? '');
  const { data: agenciesRes } = useAgencies({ per_page: 100 });
  const { data: vehiclesRes } = useVehicles({ per_page: 100 });

  const agencies = agenciesRes?.data ?? [];
  const vehicles = vehiclesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', category: '', amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      agency_id: defaultAgencyId ?? '',
      vehicle_id: defaultVehicleId ?? '',
      payment_method: '', reference: '', notes: '',
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        expense_date: expense.expense_date?.split('T')[0] ?? '',
        agency_id: expense.agency_id ?? '',
        vehicle_id: expense.vehicle_id ?? '',
        payment_method: expense.payment_method ?? '',
        reference: expense.reference ?? '',
        notes: expense.notes ?? '',
      });
    } else {
      form.reset({
        title: '', category: '', amount: 0,
        expense_date: new Date().toISOString().split('T')[0],
        agency_id: defaultAgencyId ?? '',
        vehicle_id: defaultVehicleId ?? '',
        payment_method: '', reference: '', notes: '',
      });
    }
  }, [expense, open, defaultAgencyId, defaultVehicleId]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      agency_id: values.agency_id || undefined,
      vehicle_id: values.vehicle_id || undefined,
      payment_method: values.payment_method || undefined,
    };

    try {
      if (expense) {
        await updateMutation.mutateAsync(payload as UpdateExpenseInput);
        toast.success('Dépense mise à jour');
      } else {
        await createMutation.mutateAsync(payload as Parameters<typeof createMutation.mutateAsync>[0]);
        toast.success('Dépense créée');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{expense ? 'Modifier la dépense' : 'Nouvelle dépense'}</SheetTitle>
          <SheetDescription>Saisir les informations de la dépense</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-8">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre *</FormLabel>
                  <FormControl><Input placeholder="Ex: Vidange moteur" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (MAD) *</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="expense_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="payment_method" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode de paiement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {!defaultVehicleId && (
                <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Véhicule (optionnel)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un véhicule" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">— Aucun —</SelectItem>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} · {v.registration_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {!defaultAgencyId && (
                <FormField control={form.control} name="agency_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agence (optionnel)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une agence" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">— Aucune —</SelectItem>
                        {agencies.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="reference" render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence</FormLabel>
                  <FormControl><Input placeholder="N° facture, reçu..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Enregistrement...' : expense ? 'Mettre à jour' : 'Créer la dépense'}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
