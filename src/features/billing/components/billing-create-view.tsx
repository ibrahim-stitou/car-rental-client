'use client';

import { useMemo, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Plus, Trash2, ArrowLeft, FileText } from 'lucide-react';
import { useCreateBillingDocument } from '../hooks/use-billing';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import PageContainer from '@/components/layout/page-container';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { BILLING_TYPE_OPTIONS } from '@/config/constants';
import type { BillingDocumentType } from '@/types/billing.types';

const TYPE_COLOR: Record<string, string> = {
  FA: 'bg-emerald-100 text-emerald-800', DV: 'bg-blue-100 text-blue-800',
  BC: 'bg-violet-100 text-violet-800',   BR: 'bg-orange-100 text-orange-800',
  BL: 'bg-cyan-100 text-cyan-800',       AV: 'bg-rose-100 text-rose-800',
};

const COMMON_TVA = [0, 7, 10, 14, 20];

const itemSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  quantity:    z.coerce.number().min(1, 'Min 1'),
  unit_price:  z.coerce.number().min(0),
  tax_rate:    z.coerce.number().min(0).max(100),
  total_price: z.coerce.number().min(0),
});

const schema = z.object({
  type:           z.string().min(1, 'Type requis') as z.ZodType<BillingDocumentType>,
  agency_id:      z.string().min(1, 'Agence requise'),
  reservation_id: z.string().optional(),
  client_name:    z.string().min(1, 'Nom du client requis'),
  client_address: z.string().optional(),
  client_phone:   z.string().optional(),
  client_email:   z.string().optional(),
  client_ice:     z.string().optional(),
  issue_date:     z.string().min(1, "Date d'émission requise"),
  due_date:       z.string().optional(),
  delivery_date:  z.string().optional(),
  items:          z.array(itemSchema).min(1, 'Au moins une ligne requise'),
});

type FormValues = z.infer<typeof schema>;

function fmt(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toDate(s: string | undefined): Date | undefined {
  if (!s) return undefined;
  try { return parseISO(s); } catch { return undefined; }
}

export function BillingCreateView() {
  const router = useRouter();
  const createMutation = useCreateBillingDocument();
  const { data: agenciesRes } = useAgencies({ per_page: 100 });
  const agencies = agenciesRes?.data ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'FA', agency_id: '',
      client_name: '', client_address: '', client_phone: '', client_email: '', client_ice: '',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: '', delivery_date: '',
      items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 20, total_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  // Real-time totals
  const watchedItems = useWatch({ control: form.control, name: 'items' });
  const watchedType  = useWatch({ control: form.control, name: 'type' });

  const totals = useMemo(() => {
    const subtotalHT = watchedItems.reduce((s, it) => s + (Number(it.total_price) || 0), 0);
    const taxAmount  = watchedItems.reduce((s, it) => {
      const lineHT = Number(it.total_price) || 0;
      return s + lineHT * (Number(it.tax_rate) || 0) / 100;
    }, 0);
    const tvaBreakdown: Record<number, number> = {};
    watchedItems.forEach((it) => {
      const rate   = Number(it.tax_rate) || 0;
      const amount = (Number(it.total_price) || 0) * rate / 100;
      if (rate > 0) tvaBreakdown[rate] = (tvaBreakdown[rate] ?? 0) + amount;
    });
    return { subtotalHT, taxAmount, total: subtotalHT + taxAmount, tvaBreakdown };
  }, [watchedItems]);

  const recalcItem = useCallback((index: number) => {
    const qty = Number(form.getValues(`items.${index}.quantity`)) || 0;
    const up  = Number(form.getValues(`items.${index}.unit_price`)) || 0;
    form.setValue(`items.${index}.total_price`, parseFloat((qty * up).toFixed(2)));
  }, [form]);

  const onSubmit = (values: FormValues, asDraft = false) => {
    const payload = {
      ...values,
      status:         asDraft ? 'draft' : 'pending',
      due_date:       values.due_date       || undefined,
      delivery_date:  values.delivery_date  || undefined,
      reservation_id: values.reservation_id || undefined,
    } as any;
    createMutation.mutate(payload, {
      onSuccess: () => { toast.success('Document créé avec succès'); router.push('/billing'); },
      onError:   () => toast.error('Impossible de créer le document'),
    });
  };

  return (
    <PageContainer scrollable>
      <div className="p-6 w-full space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => router.push('/billing')}>
            <ArrowLeft className="h-4 w-4 mr-1" />Facturation
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Nouveau document</h1>
            {watchedType && (
              <Badge variant="outline" className={`text-sm font-mono font-semibold ${TYPE_COLOR[watchedType] ?? ''}`}>
                {BILLING_TYPE_OPTIONS.find((o) => o.value === watchedType)?.label ?? watchedType}
              </Badge>
            )}
          </div>
        </div>

        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            La référence définitive (N° de document) sera générée automatiquement lors de la <strong>validation</strong> du document. Le brouillon reçoit une référence temporaire.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => onSubmit(v, false))}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* ─── Left column ─── */}
              <div className="lg:col-span-2 space-y-5">

                {/* Document info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Informations du document</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de document *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {BILLING_TYPE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  <span className="inline-flex items-center gap-2">
                                    <Badge variant="outline" className={`text-xs font-mono ${TYPE_COLOR[o.value] ?? ''}`}>{o.value}</Badge>
                                    {o.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="agency_id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agence *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Sélectionner une agence" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {agencies.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  <span className="flex items-center gap-2">
                                    {a.logo_url && <img src={a.logo_url} alt="" className="h-4 w-4 rounded object-cover" />}
                                    {a.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField control={form.control} name="issue_date" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d&apos;émission *</FormLabel>
                          <DatePicker date={toDate(field.value)} setDate={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')} placeholder="Sélectionner" />
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="due_date" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d&apos;échéance</FormLabel>
                          <DatePicker date={toDate(field.value)} setDate={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')} placeholder="Optionnelle" />
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="delivery_date" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de livraison</FormLabel>
                          <DatePicker date={toDate(field.value)} setDate={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')} placeholder="Optionnelle" />
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                {/* Client */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Informations client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="client_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom / Raison sociale *</FormLabel>
                        <FormControl><Input placeholder="Nom du client ou société" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="client_phone" render={({ field }) => (
                        <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="+212 6XX XXX XXX" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="client_email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="client@email.ma" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="client_address" render={({ field }) => (
                        <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input placeholder="Adresse complète" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="client_ice" render={({ field }) => (
                        <FormItem>
                          <FormLabel>ICE <span className="text-xs text-muted-foreground font-normal">(Identifiant Commun de l&apos;Entreprise)</span></FormLabel>
                          <FormControl><Input placeholder="000000000000000" maxLength={15} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                {/* Line items */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Lignes de facturation</CardTitle>
                      <Button type="button" variant="outline" size="sm"
                        onClick={() => append({ description: '', quantity: 1, unit_price: 0, tax_rate: 20, total_price: 0 })}>
                        <Plus className="h-4 w-4 mr-1" />Ajouter une ligne
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Table header (desktop) */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-1 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <div className="col-span-4">Description</div>
                      <div className="col-span-2 text-right">Qté</div>
                      <div className="col-span-2 text-right">P.U. HT</div>
                      <div className="col-span-1 text-center">TVA</div>
                      <div className="col-span-2 text-right">Total HT</div>
                      <div className="col-span-1" />
                    </div>
                    <Separator className="mb-3 hidden sm:block" />

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                          {/* Description */}
                          <div className="col-span-12 sm:col-span-4">
                            <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="sm:hidden text-xs">Description</FormLabel>
                                <FormControl><Input placeholder="Désignation du produit / service" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          {/* Qty */}
                          <div className="col-span-3 sm:col-span-2">
                            <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="sm:hidden text-xs">Qté</FormLabel>
                                <FormControl>
                                  <Input type="number" min={1} className="text-right" {...field}
                                    onChange={(e) => { field.onChange(e); recalcItem(index); }} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          {/* Unit price */}
                          <div className="col-span-3 sm:col-span-2">
                            <FormField control={form.control} name={`items.${index}.unit_price`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="sm:hidden text-xs">P.U. HT</FormLabel>
                                <FormControl>
                                  <Input type="number" min={0} step={0.01} className="text-right" {...field}
                                    onChange={(e) => { field.onChange(e); recalcItem(index); }} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          {/* TVA per line */}
                          <div className="col-span-3 sm:col-span-1">
                            <FormField control={form.control} name={`items.${index}.tax_rate`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="sm:hidden text-xs">TVA %</FormLabel>
                                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {COMMON_TVA.map((rate) => (
                                      <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          {/* Total HT (readonly) */}
                          <div className="col-span-2 sm:col-span-2">
                            <FormField control={form.control} name={`items.${index}.total_price`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="sm:hidden text-xs">Total HT</FormLabel>
                                <FormControl>
                                  <Input type="number" step={0.01} className="text-right font-medium bg-muted/50" readOnly {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          {/* Delete */}
                          <div className="col-span-1 flex items-end pb-1">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50"
                              onClick={() => remove(index)} disabled={fields.length === 1}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ─── Right column — Sticky summary ─── */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-4">
                  <Card className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Récapitulatif</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Subtotal HT */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total HT</span>
                        <span className="font-mono">{fmt(totals.subtotalHT)} MAD</span>
                      </div>

                      {/* TVA breakdown by rate */}
                      {Object.entries(totals.tvaBreakdown)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([rate, amount]) => (
                          <div key={rate} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              TVA
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{rate}%</Badge>
                            </span>
                            <span className="font-mono">{fmt(amount)} MAD</span>
                          </div>
                        ))}

                      {/* Zero TVA notice */}
                      {totals.taxAmount === 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">TVA</span>
                          <span className="font-mono text-muted-foreground">0,00 MAD</span>
                        </div>
                      )}

                      <Separator />

                      {/* Total TTC */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base">Total TTC</span>
                        <span className="font-bold text-xl font-mono">{fmt(totals.total)} MAD</span>
                      </div>

                      <Separator className="mt-2" />

                      {/* Actions */}
                      <div className="space-y-2 pt-1">
                        <Button type="button" variant="outline" className="w-full" disabled={createMutation.isPending}
                          onClick={() => form.handleSubmit((v) => onSubmit(v, true))()}>
                          Enregistrer comme brouillon
                        </Button>
                        <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                          {createMutation.isPending ? 'Création…' : 'Créer le document'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <p className="text-center text-xs text-muted-foreground">
                    {fields.length} ligne{fields.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}
