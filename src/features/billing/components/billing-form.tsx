'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateBillingDocument, useUpdateBillingDocument, useBillingDocument } from '../hooks/use-billing';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import type { BillingDocument } from '@/types/billing.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FormDatePicker } from '@/components/shared/form-date-picker';
import { BILLING_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/config/constants';

const itemSchema = z.object({
  description: z.string().min(1, 'Required'),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().min(0),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(20),
  total_price: z.coerce.number().min(0),
});

const schema = z.object({
  type: z.string().min(1, 'Type is required'),
  agency_id: z.string().min(1, 'Agency is required'),
  client_name: z.string().min(1, 'Client name is required'),
  client_address: z.string().optional(),
  client_phone: z.string().optional(),
  client_email: z.string().optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().optional(),
  tax_rate: z.coerce.number().min(0).max(100),
  discount_percentage: z.coerce.number().min(0).max(100).optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: BillingDocument | null;
  onSuccess?: () => void;
}

const BLANK_ITEM = { description: '', quantity: 1, unit_price: 0, tax_rate: 20, total_price: 0 };
const DEFAULT_FORM = {
  type: 'FA' as const, agency_id: '', client_name: '', client_address: '', client_phone: '',
  client_email: '', issue_date: new Date().toISOString().split('T')[0], due_date: '',
  tax_rate: 20, discount_percentage: 0, payment_method: '', notes: '',
  items: [BLANK_ITEM],
};

export function BillingForm({ open, onOpenChange, document, onSuccess }: Props) {
  const createMutation = useCreateBillingDocument();
  const updateMutation = useUpdateBillingDocument(document?.id ?? '');
  // Fetch full document (with items) when editing — the list row may not include items
  const { data: fullDocRes } = useBillingDocument(document?.id ?? '');
  const fullDoc = fullDocRes?.data ?? null;
  const { data: agenciesRes } = useAgencies({ per_page: 100 });
  const agencies = agenciesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_FORM,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  useEffect(() => {
    // Use fullDoc (fetched with items) if available, otherwise fall back to prop
    const doc = fullDoc ?? (document?.id ? document : null);
    if (doc) {
      const items = (doc.items?.length ?? 0) > 0
        ? doc.items!.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
            tax_rate: i.tax_rate ?? 20,
            total_price: i.total_price,
          }))
        : [BLANK_ITEM];
      form.reset({
        type: doc.type,
        agency_id: (doc as any).agency_id ?? (doc as any).agency?.id ?? '',
        client_name: doc.client_name,
        client_address: doc.client_address ?? '',
        client_phone: doc.client_phone ?? '',
        client_email: doc.client_email ?? '',
        issue_date: doc.issue_date,
        due_date: doc.due_date ?? '',
        tax_rate: Number((doc as any).tax_rate ?? 20),
        discount_percentage: Number((doc as any).discount_percentage ?? 0),
        payment_method: doc.payment_method ?? '',
        notes: (doc as any).notes ?? '',
        items,
      });
    } else if (!document) {
      form.reset(DEFAULT_FORM);
    }
  }, [fullDoc, document, form, open]);

  const onSubmit = (values: FormValues) => {
    const payload = { ...values, payment_method: values.payment_method || undefined } as any;
    if (document) {
      updateMutation.mutate(payload, {
        onSuccess: () => { toast.success('Document mis à jour'); onOpenChange(false); onSuccess?.(); },
        onError: () => toast.error('Échec de la mise à jour document'),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success('Document créé'); onOpenChange(false); form.reset(); onSuccess?.(); },
        onError: () => toast.error('Impossible de créer document'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{document ? 'Edit Document' : 'New Document'}</SheetTitle>
          <SheetDescription>{document ? 'Update billing document' : 'Create a new billing document'}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Document Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{BILLING_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="agency_id" render={({ field }) => (
                  <FormItem><FormLabel>Agence *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une agence" /></SelectTrigger></FormControl>
                      <SelectContent>{agencies.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Client</p>
              <FormField control={form.control} name="client_name" render={({ field }) => (
                <FormItem><FormLabel>Client Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="client_phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="client_email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="client_address" render={({ field }) => (<FormItem><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Dates & Financials</p>
              <div className="grid grid-cols-4 gap-4">
                <FormField control={form.control} name="issue_date" render={({ field }) => (<FormItem><FormLabel>Date d'émission *</FormLabel><FormDatePicker value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="due_date" render={({ field }) => (<FormItem><FormLabel>Date d'échéance</FormLabel><FormDatePicker value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="tax_rate" render={({ field }) => (<FormItem><FormLabel>Tax Rate (%)</FormLabel><FormControl><Input type="number" min={0} max={100} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="discount_percentage" render={({ field }) => (<FormItem><FormLabel>Discount (%)</FormLabel><FormControl><Input type="number" min={0} max={100} {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Items</p>
                <Button type="button" variant="outline" size="sm" onClick={() => append(BLANK_ITEM)}>
                  <Plus className="mr-1 h-4 w-4" /> Add Item
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Description</FormLabel><FormControl><Input placeholder="Service description" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="col-span-2">
                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Qty</FormLabel><FormControl><Input type="number" min={1} {...field} onChange={(e) => { field.onChange(e); const qty = +e.target.value; const up = form.getValues(`items.${index}.unit_price`); form.setValue(`items.${index}.total_price`, qty * up); }} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="col-span-2">
                    <FormField control={form.control} name={`items.${index}.unit_price`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Unit Price</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} onChange={(e) => { field.onChange(e); const up = +e.target.value; const qty = form.getValues(`items.${index}.quantity`); form.setValue(`items.${index}.total_price`, qty * up); }} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="col-span-2">
                    <FormField control={form.control} name={`items.${index}.total_price`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Total</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="col-span-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Remarques</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : document ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
