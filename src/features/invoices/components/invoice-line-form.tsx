'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconPlus, IconPencil } from '@tabler/icons-react';

export interface InvoiceLineFormValues {
  designation: string;
  nombre: number;
  amount_ht: number;
  tva: number;
}

const EMPTY_VALUES: InvoiceLineFormValues = {
  designation: '',
  nombre: 1,
  amount_ht: 0,
  tva: 20,
};

const invoiceLineSchema = z.object({
  designation: z.string().min(1, 'Designation is required'),
  nombre: z.coerce
    .number()
    .min(0.01, 'Quantity must be greater than 0')
    .transform(val => parseFloat(val.toFixed(2))),
  amount_ht: z.coerce
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .transform(val => parseFloat(val.toFixed(2))),
  tva: z.coerce
    .number()
    .min(0, 'VAT must be at least 0')
    .max(100, 'VAT cannot exceed 100%')
    .transform(val => parseFloat(val.toFixed(1))),
});

interface InvoiceLineFormProps {
  onSubmit: (data: InvoiceLineFormValues) => Promise<void>;
  onCancelEdit?: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
  defaultValues?: Partial<InvoiceLineFormValues>;
}

export default function InvoiceLineForm({
                                          onSubmit,
                                          onCancelEdit,
                                          isSubmitting,
                                          isEditing,
                                          defaultValues = EMPTY_VALUES,
                                        }: InvoiceLineFormProps) {
  const [totalHT, setTotalHT] = useState<number>(0);
  const [totalTTC, setTotalTTC] = useState<number>(0);

  const form = useForm<InvoiceLineFormValues>({
    resolver: zodResolver(invoiceLineSchema),
    defaultValues: isEditing
      ? (defaultValues as InvoiceLineFormValues)
      : EMPTY_VALUES,
  });

  const watchNombre = form.watch('nombre');
  const watchAmountHT = form.watch('amount_ht');
  const watchTVA = form.watch('tva');

  useEffect(() => {
    const nombre = parseFloat(watchNombre?.toString() || '0') || 0;
    const amountHT = parseFloat(watchAmountHT?.toString() || '0') || 0;
    const tva = parseFloat(watchTVA?.toString() || '0') || 0;

    const newTotalHT = nombre * amountHT;
    const newTotalTTC = newTotalHT * (1 + tva / 100);

    setTotalHT(newTotalHT);
    setTotalTTC(newTotalTTC);
  }, [watchNombre, watchAmountHT, watchTVA]);

  useEffect(() => {
    if (isEditing) {
      form.reset(defaultValues as InvoiceLineFormValues);
    } else {
      form.reset(EMPTY_VALUES);
    }
  }, [isEditing, defaultValues, form]);

  const handleSubmit = async (data: InvoiceLineFormValues) => {
    await onSubmit(data);

    if (!isSubmitting && !isEditing) {
      form.reset(EMPTY_VALUES);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <CardTitle className="text-lg font-medium">
          {isEditing ? 'Edit Invoice Line' : 'Add New Invoice Line'}
        </CardTitle>

        {/* Main Form Grid - Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-3 items-end">
          {/* Designation - Full width on mobile, 2 cols on md, 2 cols on lg */}
          <FormField
            control={form.control}
            name="designation"
            render={({ field }) => (
              <FormItem className="space-y-1 col-span-1 md:col-span-2 lg:col-span-2">
                <FormLabel className="text-xs font-medium text-gray-700">Designation*</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Description"
                    className="h-8 text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Quantity - Full width on mobile, 1 col on md and lg */}
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-medium text-gray-700">Quantity*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="h-8 text-sm"
                    onChange={(e) => {
                      const value = e.target.value === '' ? '0' : e.target.value;
                      field.onChange(parseFloat(value));
                    }}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Unit Price - Full width on mobile, 1 col on md and lg */}
          <FormField
            control={form.control}
            name="amount_ht"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-medium text-gray-700">Unit Price (€ HT)*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="h-8 text-sm"
                    onChange={(e) => {
                      const value = e.target.value === '' ? '0' : e.target.value;
                      field.onChange(parseFloat(value));
                    }}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* VAT Rate - Full width on mobile, 1 col on md and lg */}
          <FormField
            control={form.control}
            name="tva"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-medium text-gray-700">VAT Rate (%)*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="h-8 text-sm"
                    onChange={(e) => {
                      const value = e.target.value === '' ? '0' : e.target.value;
                      field.onChange(parseFloat(value));
                    }}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Total HT - Full width on mobile, 1 col on md and lg */}
          <div className="flex flex-col space-y-1">
            <FormLabel className="text-xs font-medium text-gray-700">Total HT</FormLabel>
            <div className="flex items-center h-8">
              <div className="px-3 py-1 rounded-md bg-gray-100 border border-gray-200 shadow-sm flex items-center w-full h-full">
                <Calculator className="h-3 w-3 text-gray-600 mr-2" />
                <p className="text-sm font-bold">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 2,
                  }).format(totalHT)}
                </p>
              </div>
            </div>
          </div>

          {/* Total TTC - Full width on mobile, 1 col on md and lg */}
          <div className="flex flex-col space-y-1">
            <FormLabel className="text-xs font-medium text-gray-700">Total TTC</FormLabel>
            <div className="flex items-center h-8">
              <div className="px-3 py-1 rounded-md bg-indigo-50 border border-indigo-100 shadow-sm flex items-center w-full h-full">
                <Calculator className="h-3 w-3 text-indigo-600 mr-2" />
                <p className="text-sm font-bold text-indigo-700">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 2,
                  }).format(totalTTC)}
                </p>
              </div>
            </div>
          </div>

          {/* Add/Update Button - Full width on mobile, 1 col on md and lg */}
          <div className="flex flex-col space-y-1">
            <FormLabel className="text-xs font-medium text-gray-700 invisible">Action</FormLabel>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8 text-xs px-2 w-full"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {isEditing ? (
                    <>
                      <IconPencil className="mr-1 h-3 w-3" />
                      <span className="whitespace-nowrap">Update</span>
                    </>
                  ) : (
                    <>
                      <IconPlus className="mr-1 h-3 w-3" />
                      <span className="whitespace-nowrap">Add Line</span>
                    </>
                  )}
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Cancel Button (only for editing) - Full width on mobile, aligned right on larger screens */}
        {isEditing && onCancelEdit && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancelEdit();
                form.reset(EMPTY_VALUES);
              }}
              disabled={isSubmitting}
              className="h-8 text-xs px-3 border-gray-300 w-full md:w-auto"
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}