'use client';

import { useEffect, useRef, useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { applyServerErrors } from '@/lib/form-errors';
import { SelectField } from '@/components/shared/select-field';
import { FormDatePicker } from '@/components/shared/form-date-picker';
import { useParameterOptions } from '@/features/settings/hooks/use-parameters';
import { IconUpload, IconX, IconFileTypePdf, IconPhoto, IconFile } from '@tabler/icons-react';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'bank_transfer', label: 'Virement' },
  { value: 'check', label: 'Chèque' },
  { value: 'online', label: 'En ligne' },
];

const schema = z.object({
  title:          z.string().min(1, 'Titre requis'),
  category:       z.string().min(1, 'Catégorie requise'),
  amount:         z.coerce.number().min(0.01, 'Montant requis'),
  expense_date:   z.string().min(1, 'Date requise'),
  agency_id:      z.string().min(1, 'Agence requise'),
  vehicle_id:     z.string().optional(),
  payment_method: z.string().optional(),
  reference:      z.string().optional(),
  notes:          z.string().optional(),
  description:    z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PendingFile {
  file: File;
  type: 'receipt' | 'document';
  preview?: string;
}

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return <IconPhoto className="h-4 w-4 text-blue-500" />;
  if (mime === 'application/pdf') return <IconFileTypePdf className="h-4 w-4 text-red-500" />;
  return <IconFile className="h-4 w-4 text-gray-500" />;
}

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
  const { options: categoryOptions } = useParameterOptions('expense_category');
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const docInputRef     = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', category: '', amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      agency_id: defaultAgencyId ?? '',
      vehicle_id: defaultVehicleId ?? '',
      payment_method: '', reference: '', notes: '', description: '',
    },
  });

  useEffect(() => {
    if (!open) { setPendingFiles([]); return; }
    if (expense) {
      form.reset({
        title: expense.title, category: expense.category, amount: expense.amount,
        expense_date: expense.expense_date?.split('T')[0] ?? '',
        agency_id: expense.agency_id ?? '',
        vehicle_id: expense.vehicle_id ?? '',
        payment_method: expense.payment_method ?? '',
        reference: expense.reference ?? '',
        notes: expense.notes ?? '',
        description: (expense as any).description ?? '',
      });
    } else {
      form.reset({
        title: '', category: '', amount: 0,
        expense_date: new Date().toISOString().split('T')[0],
        agency_id: defaultAgencyId ?? '',
        vehicle_id: defaultVehicleId ?? '',
        payment_method: '', reference: '', notes: '', description: '',
      });
    }
    setPendingFiles([]);
  }, [expense, open, defaultAgencyId, defaultVehicleId]);

  const addFiles = (files: FileList | null, type: 'receipt' | 'document') => {
    if (!files) return;
    const newFiles: PendingFile[] = Array.from(files).map(file => ({
      file,
      type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => {
      const f = prev[index];
      if (f.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFiles = async (expenseId: string) => {
    const receipts  = pendingFiles.filter(f => f.type === 'receipt');
    const documents = pendingFiles.filter(f => f.type === 'document');

    if (receipts.length > 0) {
      const fd = new FormData();
      receipts.forEach(f => fd.append('receipts[]', f.file));
      await apiClient.post(apiRoutes.expenses.uploadReceipts(expenseId), fd);
    }
    if (documents.length > 0) {
      const fd = new FormData();
      documents.forEach(f => fd.append('documents[]', f.file));
      await apiClient.post(apiRoutes.expenses.uploadDocuments(expenseId), fd);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      agency_id:      (values.agency_id && values.agency_id !== '__none__') ? values.agency_id : undefined,
      vehicle_id:     (values.vehicle_id && values.vehicle_id !== '__none__') ? values.vehicle_id : undefined,
      payment_method: values.payment_method || undefined,
      description:    values.description || undefined,
    };

    try {
      let expenseId = expense?.id;

      if (expense) {
        await updateMutation.mutateAsync(payload as UpdateExpenseInput);
        toast.success('Dépense mise à jour');
      } else {
        const res = await createMutation.mutateAsync(payload as any);
        expenseId = (res as any)?.data?.id;
        toast.success('Dépense créée');
      }

      // Upload files after save
      if (expenseId && pendingFiles.length > 0) {
        setUploading(true);
        try {
          await uploadFiles(expenseId);
          toast.success(`${pendingFiles.length} fichier(s) téléversé(s)`);
        } catch {
          toast.error('Dépense sauvegardée mais erreur lors de l\'upload des fichiers');
        } finally {
          setUploading(false);
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      applyServerErrors(err, form, "Erreur lors de l'enregistrement");
    }
  };

  const isLoading = isPending || uploading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{expense ? 'Modifier la dépense' : 'Nouvelle dépense'}</SheetTitle>
          <SheetDescription>Saisir les informations et joindre les justificatifs</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Titre *</FormLabel>
                  <FormControl><Input placeholder="Ex: Vidange moteur" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Catégorie *</FormLabel>
                    <SelectField value={field.value} onChange={field.onChange} placeholder="Catégorie" options={categoryOptions} />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Montant (MAD) *</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="expense_date" render={({ field }) => (
                  <FormItem><FormLabel>Date *</FormLabel>
                    <FormDatePicker value={field.value} onChange={field.onChange} placeholder="Choisir la date" />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="payment_method" render={({ field }) => (
                  <FormItem><FormLabel>Mode de paiement</FormLabel>
                    <Select
                      onValueChange={v => field.onChange(v === '__none__' ? '' : v)}
                      value={field.value || '__none__'}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">— Non précisé —</SelectItem>
                        {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {!defaultVehicleId && (
                <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                  <FormItem><FormLabel>Véhicule (optionnel)</FormLabel>
                    <SelectField
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Sélectionner un véhicule"
                      options={vehicles.map(v => ({ value: v.id, label: `${v.brand} ${v.model}`, sub: v.registration_number }))}
                    />
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {!defaultAgencyId && (
                <FormField control={form.control} name="agency_id" render={({ field }) => (
                  <FormItem><FormLabel>Agence *</FormLabel>
                    <SelectField
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Sélectionner une agence"
                      options={agencies.map(a => ({ value: a.id, label: a.name }))}
                    />
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="reference" render={({ field }) => (
                <FormItem><FormLabel>Référence</FormLabel>
                  <FormControl><Input placeholder="N° facture, reçu..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description libre (agent)</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Observations, détails supplémentaires…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* File attachments */}
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Pièces jointes</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => receiptInputRef.current?.click()}>
                      <IconUpload className="h-3.5 w-3.5 mr-1" />Justificatif
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()}>
                      <IconUpload className="h-3.5 w-3.5 mr-1" />Document
                    </Button>
                  </div>
                  <input ref={receiptInputRef} type="file" multiple accept="image/jpeg,image/png,application/pdf" className="hidden"
                    onChange={e => { addFiles(e.target.files, 'receipt'); e.target.value = ''; }} />
                  <input ref={docInputRef} type="file" multiple className="hidden"
                    onChange={e => { addFiles(e.target.files, 'document'); e.target.value = ''; }} />
                </div>

                {pendingFiles.length > 0 ? (
                  <div className="space-y-1.5">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/20 group">
                        {f.preview
                          ? <img src={f.preview} alt="" className="h-8 w-10 object-cover rounded" />
                          : <div className="h-8 w-10 flex items-center justify-center">{getFileIcon(f.file.type)}</div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{f.file.name}</p>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                              {f.type === 'receipt' ? 'Justificatif' : 'Document'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {(f.file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => removeFile(i)}>
                          <IconX className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  expense ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Utilisez le bouton "Voir" pour gérer les documents existants
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Ajoutez factures, reçus ou autres documents justificatifs
                    </p>
                  )
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? (uploading ? 'Upload en cours…' : 'Enregistrement…')
                  : expense ? 'Mettre à jour' : 'Créer la dépense'}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
