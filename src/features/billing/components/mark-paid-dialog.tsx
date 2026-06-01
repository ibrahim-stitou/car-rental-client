'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useMarkBillingPaid } from '../hooks/use-billing';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BillingDocument, PaymentMethod } from '@/types/billing.types';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'check', label: 'Chèque' },
  { value: 'online', label: 'Paiement en ligne' },
];

const schema = z.object({
  payment_method: z.string().min(1, 'Mode de paiement requis'),
  payment_reference: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: BillingDocument;
  onSuccess?: () => void;
}

export function MarkPaidDialog({ open, onOpenChange, document, onSuccess }: Props) {
  const markPaid = useMarkBillingPaid();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { payment_method: 'cash', payment_reference: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await markPaid.mutateAsync({ id: document.id, input: { ...values, payment_method: values.payment_method as PaymentMethod } });
      toast.success('Document marqué comme payé');
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Échec de l\'opération');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Marquer comme payé</DialogTitle>
          <DialogDescription>
            Document <strong className="font-mono">{document.document_number ?? document.reference}</strong> — {Number(document.balance).toLocaleString('fr-MA')} MAD à encaisser
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="payment_method" render={({ field }) => (
              <FormItem>
                <FormLabel>Mode de paiement *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="payment_reference" render={({ field }) => (
              <FormItem>
                <FormLabel>Référence (optionnel)</FormLabel>
                <FormControl><Input placeholder="N° chèque, virement..." {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={markPaid.isPending}>
                {markPaid.isPending ? 'Enregistrement...' : 'Confirmer le paiement'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
