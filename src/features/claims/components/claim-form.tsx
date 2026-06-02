'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateClaim, useUpdateClaim } from '../hooks/use-claims';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import { useClients } from '@/features/clients/hooks/use-clients';
import type { Claim } from '@/types/claim.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ACCIDENT_TYPE_OPTIONS, CLAIM_STATUS_OPTIONS } from '@/config/constants';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  vehicle_id:                  z.string().min(1, 'Véhicule requis'),
  client_id:                   z.string().optional(),
  claim_date:                  z.string().min(1, 'Date requise'),
  title:                       z.string().min(1, 'Titre requis'),
  description:                 z.string().optional(),
  agent_notes:                 z.string().optional(),
  accident_type:               z.string().min(1, 'Type requis'),
  is_client_responsible:       z.boolean().optional(),
  responsible_notes:           z.string().optional(),
  status:                      z.string().optional(),
  total_damage_amount:         z.coerce.number().min(0).optional(),
  insurance_amount_recovered:  z.coerce.number().min(0).optional(),
  client_paid_amount:          z.coerce.number().min(0).optional(),
  company_expense_amount:      z.coerce.number().min(0).optional(),
  insurance_reference:         z.string().optional(),
  insurance_claim_date:        z.string().optional(),
  settlement_date:             z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function SearchableSelect({
  value, onChange, placeholder, items, disabled,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  items: Array<{ id: string; label: string; sub?: string }>; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find(i => i.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-between font-normal h-10', !value && 'text-muted-foreground')} disabled={disabled}>
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher..." />
          <CommandList>
            <CommandEmpty>Aucun résultat</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__none__" onSelect={() => { onChange(''); setOpen(false); }}>
                <span className="text-muted-foreground italic">— Aucun —</span>
              </CommandItem>
              {items.slice(0, 100).map(item => (
                <CommandItem key={item.id} value={item.id} onSelect={() => { onChange(item.id); setOpen(false); }}>
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    {item.sub && <div className="text-xs text-muted-foreground">{item.sub}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim?: Claim | null;
  defaultVehicleId?: string;
  onSuccess?: () => void;
}

export function ClaimForm({ open, onOpenChange, claim, defaultVehicleId, onSuccess }: Props) {
  const createMutation = useCreateClaim();
  const updateMutation = useUpdateClaim(claim?.id ?? '');
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const { data: clientsRes } = useClients({ per_page: 200 });

  const vehicles = (vehiclesRes?.data ?? []).map(v => ({ id: v.id, label: `${v.brand} ${v.model} ${v.year}`, sub: v.registration_number }));
  const clients = (clientsRes?.data ?? []).map(c => ({ id: c.id, label: `${(c as any).first_name} ${(c as any).last_name}`, sub: (c as any).phone }));

  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicle_id: defaultVehicleId ?? '', client_id: '', claim_date: new Date().toISOString().split('T')[0],
      title: '', description: '', agent_notes: '',
      accident_type: 'collision', is_client_responsible: false, responsible_notes: '',
      status: 'open', total_damage_amount: 0, insurance_amount_recovered: 0,
      client_paid_amount: 0, company_expense_amount: 0,
      insurance_reference: '', insurance_claim_date: '', settlement_date: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (claim) {
      form.reset({
        vehicle_id: claim.vehicle_id,
        client_id: claim.client_id ?? '',
        claim_date: claim.claim_date,
        title: claim.title,
        description: claim.description ?? '',
        agent_notes: claim.agent_notes ?? '',
        accident_type: claim.accident_type,
        is_client_responsible: claim.is_client_responsible,
        responsible_notes: claim.responsible_notes ?? '',
        status: claim.status,
        total_damage_amount: Number(claim.total_damage_amount),
        insurance_amount_recovered: Number(claim.insurance_amount_recovered),
        client_paid_amount: Number(claim.client_paid_amount),
        company_expense_amount: Number(claim.company_expense_amount),
        insurance_reference: claim.insurance_reference ?? '',
        insurance_claim_date: claim.insurance_claim_date ?? '',
        settlement_date: claim.settlement_date ?? '',
      });
    } else {
      form.reset({
        vehicle_id: defaultVehicleId ?? '', client_id: '',
        claim_date: new Date().toISOString().split('T')[0],
        title: '', description: '', agent_notes: '',
        accident_type: 'collision', is_client_responsible: false, responsible_notes: '',
        status: 'open', total_damage_amount: 0, insurance_amount_recovered: 0,
        client_paid_amount: 0, company_expense_amount: 0,
        insurance_reference: '', insurance_claim_date: '', settlement_date: '',
      });
    }
  }, [claim, open]);

  const isClientResponsible = form.watch('is_client_responsible');

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      client_id: values.client_id || undefined,
      insurance_claim_date: values.insurance_claim_date || undefined,
      settlement_date: values.settlement_date || undefined,
    };
    if (claim) {
      updateMutation.mutate(payload as any, {
        onSuccess: () => { toast.success('Sinistre mis à jour'); onOpenChange(false); onSuccess?.(); },
        onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
      });
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: () => { toast.success('Sinistre créé'); onOpenChange(false); form.reset(); onSuccess?.(); },
        onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erreur'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{claim ? 'Modifier le sinistre' : 'Déclarer un sinistre'}</SheetTitle>
          <SheetDescription>
            {claim ? 'Mettre à jour les informations du sinistre' : 'Enregistrer un nouveau sinistre / accident'}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Véhicule *</FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onChange={field.onChange} placeholder="Sélectionner un véhicule" items={vehicles} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="client_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client impliqué</FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value ?? ''} onChange={field.onChange} placeholder="Optionnel" items={clients} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="claim_date" render={({ field }) => (
                  <FormItem><FormLabel>Date du sinistre *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{CLAIM_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Titre *</FormLabel><FormControl><Input placeholder="Ex: Collision en ville" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="accident_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'accident *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{ACCIDENT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="is_client_responsible" render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel>Responsabilité</FormLabel>
                    <div className="flex items-center justify-between rounded-lg border p-2.5 h-10">
                      <span className="text-sm">{isClientResponsible ? 'Client responsable' : 'Équipe / Non défini'}</span>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="responsible_notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{isClientResponsible ? 'Détails responsabilité client' : 'Détails (équipe / circonstances)'}</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Préciser les circonstances…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description détaillée</FormLabel><FormControl><Textarea rows={3} placeholder="Dégâts constatés, circonstances…" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <Separator />
              <p className="text-sm font-semibold">Montants financiers</p>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="total_damage_amount" render={({ field }) => (
                  <FormItem><FormLabel>Montant total dégâts (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="insurance_amount_recovered" render={({ field }) => (
                  <FormItem><FormLabel>Remboursement assurance (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="client_paid_amount" render={({ field }) => (
                  <FormItem><FormLabel>Montant payé par client (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="company_expense_amount" render={({ field }) => (
                  <FormItem><FormLabel>Charge entreprise (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Separator />
              <p className="text-sm font-semibold">Assurance</p>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="insurance_reference" render={({ field }) => (
                  <FormItem><FormLabel>Réf. déclaration assurance</FormLabel><FormControl><Input placeholder="N° de déclaration" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="insurance_claim_date" render={({ field }) => (
                  <FormItem><FormLabel>Date déclaration assurance</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="settlement_date" render={({ field }) => (
                <FormItem><FormLabel>Date de règlement</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="agent_notes" render={({ field }) => (
                <FormItem><FormLabel>Notes agent (libre)</FormLabel><FormControl><Textarea rows={2} placeholder="Observations personnelles…" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Annuler</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : claim ? 'Mettre à jour' : 'Déclarer'}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
