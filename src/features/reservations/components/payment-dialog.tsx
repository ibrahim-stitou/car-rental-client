'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Trash2, Plus, CreditCard, AlertCircle } from 'lucide-react';
import { useReservationPayments, useAddPayment, useDeletePayment } from '../hooks/use-payments';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'check', label: 'Chèque' },
  { value: 'online', label: 'Paiement en ligne' },
];

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Montant requis'),
  payment_method: z.string().min(1, 'Mode de paiement requis'),
  payment_date: z.string().min(1, 'Date requise'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  reservationRef?: string;
}

export function PaymentDialog({ open, onOpenChange, reservationId, reservationRef }: Props) {
  const [showForm, setShowForm] = useState(false);
  const { data: res, isLoading } = useReservationPayments(reservationId);
  const addPayment = useAddPayment(reservationId);
  const deletePayment = useDeletePayment(reservationId);

  const summary = res?.data;
  const payments = summary?.payments ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      payment_method: '',
      payment_date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await addPayment.mutateAsync({
        ...values,
        payment_method: values.payment_method as Parameters<typeof addPayment.mutateAsync>[0]['payment_method'],
      });
      toast.success('Paiement enregistré');
      form.reset({ amount: 0, payment_method: '', payment_date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
      setShowForm(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement du paiement");
    }
  };

  const handleDelete = async (paymentId: string) => {
    try {
      await deletePayment.mutateAsync(paymentId);
      toast.success('Paiement supprimé');
    } catch {
      toast.error('Impossible de supprimer ce paiement');
    }
  };

  const balanceColor = !summary ? '' : summary.is_fully_paid ? 'text-green-600' : 'text-orange-600';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paiements — {reservationRef}</DialogTitle>
          <DialogDescription>Historique et gestion des paiements de la réservation</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Total dû</div>
                <div className="font-bold text-sm">{summary?.total_amount?.toLocaleString('fr-MA') ?? 0} MAD</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Payé</div>
                <div className="font-bold text-sm text-green-600">{summary?.total_paid?.toLocaleString('fr-MA') ?? 0} MAD</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Solde</div>
                <div className={`font-bold text-sm ${balanceColor}`}>{summary?.balance?.toLocaleString('fr-MA') ?? 0} MAD</div>
              </div>
            </div>

            {summary && !summary.is_fully_paid && summary.balance > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Solde restant : <strong>{summary.balance?.toLocaleString('fr-MA')} MAD</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Payment list */}
            {payments.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">Paiements effectués</div>
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{Number(payment.amount).toLocaleString('fr-MA')} MAD</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: fr })} · {PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label}
                        {payment.reference && ` · Réf: ${payment.reference}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(payment.id)}
                      disabled={deletePayment.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement enregistré</p>
            )}

            <Separator />

            {/* Add payment form */}
            {showForm ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <div className="text-sm font-medium">Nouveau paiement</div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant (MAD) *</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="payment_date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="payment_method" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode de paiement *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="reference" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence</FormLabel>
                      <FormControl><Input placeholder="N° reçu, chèque..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={addPayment.isPending}>
                      {addPayment.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
                  </div>
                </form>
              </Form>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un paiement
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
