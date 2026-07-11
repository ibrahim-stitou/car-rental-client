'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useCreateClaim, useUpdateClaim, claimKeys } from '../hooks/use-claims';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import { useClients } from '@/features/clients/hooks/use-clients';
import { useParameterOptions } from '@/features/settings/hooks/use-parameters';
import type { Claim } from '@/types/claim.types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SelectField } from '@/components/shared/select-field';
import { FormDatePicker } from '@/components/shared/form-date-picker';
import { DocumentsSection } from '@/components/shared/documents-section';
import PageContainer from '@/components/layout/page-container';
import { applyServerErrors } from '@/lib/form-errors';
import { apiRoutes } from '@/config/apiRoutes';
import { CLAIM_STATUS_OPTIONS } from '@/config/constants';

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

const emptyValues: FormValues = {
  vehicle_id: '', client_id: '', claim_date: new Date().toISOString().split('T')[0],
  title: '', description: '', agent_notes: '',
  accident_type: '', is_client_responsible: false, responsible_notes: '',
  status: 'open', total_damage_amount: 0, insurance_amount_recovered: 0,
  client_paid_amount: 0, company_expense_amount: 0,
  insurance_reference: '', insurance_claim_date: '', settlement_date: '',
};

interface Props {
  claim?: Claim | null;
  defaultVehicleId?: string;
}

export function ClaimFormView({ claim, defaultVehicleId }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const createMutation = useCreateClaim();
  const updateMutation = useUpdateClaim(claim?.id ?? '');
  const { data: vehiclesRes } = useVehicles({ per_page: 200 });
  const { data: clientsRes } = useClients({ per_page: 200 });
  const { options: accidentTypeOptions } = useParameterOptions('accident_type');

  const vehicles = (vehiclesRes?.data ?? []).map(v => ({ value: v.id, label: `${v.brand} ${v.model} ${(v as any).year ?? ''}`.trim(), sub: v.registration_number }));
  const clients  = (clientsRes?.data ?? []).map(c => ({ value: c.id, label: `${(c as any).first_name ?? ''} ${(c as any).last_name ?? ''}`.trim(), sub: (c as any).phone }));

  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { ...emptyValues, vehicle_id: defaultVehicleId ?? '' } });

  useEffect(() => {
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
      form.reset({ ...emptyValues, vehicle_id: defaultVehicleId ?? '' });
    }
  }, [claim, defaultVehicleId, form]);

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
        onSuccess: () => { toast.success('Sinistre mis à jour'); router.push(`/claims/${claim.id}`); },
        onError: (err) => applyServerErrors(err, form, 'Échec de la mise à jour'),
      });
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: (res) => { toast.success('Sinistre déclaré'); router.push(`/claims/${(res as any)?.data?.id}`); },
        onError: (err) => applyServerErrors(err, form, 'Impossible de déclarer le sinistre'),
      });
    }
  };

  return (
    <PageContainer scrollable>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 max-w-3xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground"
                onClick={() => router.push(claim ? `/claims/${claim.id}` : '/claims')}>
                <ArrowLeft className="h-4 w-4" />{claim ? claim.claim_number : 'Sinistres'}
              </Button>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-lg font-bold">{claim ? 'Modifier le sinistre' : 'Déclarer un sinistre'}</h1>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(claim ? `/claims/${claim.id}` : '/claims')}>Annuler</Button>
              <Button type="submit" disabled={isPending} className="gap-1.5">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isPending ? 'Enregistrement…' : claim ? 'Mettre à jour' : 'Déclarer'}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Véhicule & client</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Véhicule *</FormLabel>
                    <SelectField value={field.value} onChange={field.onChange} placeholder="Sélectionner un véhicule" options={vehicles} />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="client_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client impliqué</FormLabel>
                    <SelectField value={field.value ?? ''} onChange={field.onChange} placeholder="Optionnel — équipe/aucun" options={clients} />
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="claim_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date du sinistre *</FormLabel>
                    <FormDatePicker value={field.value} onChange={field.onChange} placeholder="Choisir la date" />
                    <FormMessage />
                  </FormItem>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Détails de l'incident</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Titre *</FormLabel><FormControl><Input placeholder="Ex: Collision en ville" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="accident_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'accident *</FormLabel>
                    <SelectField value={field.value} onChange={field.onChange} placeholder="Sélectionner" options={accidentTypeOptions} />
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Montants financiers</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="total_damage_amount" render={({ field }) => (
                  <FormItem><FormLabel>Montant total dégâts (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="insurance_amount_recovered" render={({ field }) => (
                  <FormItem><FormLabel>Remboursement assurance (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="client_paid_amount" render={({ field }) => (
                  <FormItem><FormLabel>Montant payé par client (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="company_expense_amount" render={({ field }) => (
                  <FormItem><FormLabel>Charge entreprise (MAD)</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Assurance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="insurance_reference" render={({ field }) => (
                  <FormItem><FormLabel>Réf. déclaration assurance</FormLabel><FormControl><Input placeholder="N° de déclaration" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="insurance_claim_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date déclaration assurance</FormLabel>
                    <FormDatePicker value={field.value} onChange={field.onChange} placeholder="Choisir la date" />
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="settlement_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de règlement</FormLabel>
                  <FormDatePicker value={field.value} onChange={field.onChange} placeholder="Choisir la date" />
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="agent_notes" render={({ field }) => (
                <FormItem><FormLabel>Notes agent (libre)</FormLabel><FormControl><Textarea rows={2} placeholder="Observations personnelles…" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {!claim && (
            <p className="text-xs text-muted-foreground">
              Vous pourrez ajouter les photos et documents une fois le sinistre déclaré.
            </p>
          )}

          {claim && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents</h2>
              <Separator />
              <DocumentsSection
                title="Photos du sinistre"
                entityId={claim.id}
                uploadUrl={apiRoutes.claims.uploadPhotos(claim.id)}
                deleteUrlFn={(mid) => apiRoutes.claims.deleteMedia(claim.id, mid)}
                initialDocuments={claim.photos}
                fieldName="photos"
                accept="image/*"
                onRefresh={() => qc.invalidateQueries({ queryKey: claimKeys.detail(claim.id) })}
              />
              <DocumentsSection
                title="Documents"
                entityId={claim.id}
                uploadUrl={apiRoutes.claims.uploadDocs(claim.id)}
                deleteUrlFn={(mid) => apiRoutes.claims.deleteMedia(claim.id, mid)}
                initialDocuments={claim.documents}
                accept="application/pdf,image/*"
                onRefresh={() => qc.invalidateQueries({ queryKey: claimKeys.detail(claim.id) })}
              />
              <DocumentsSection
                title="Documents assurance"
                entityId={claim.id}
                uploadUrl={apiRoutes.claims.uploadInsuranceDocs(claim.id)}
                deleteUrlFn={(mid) => apiRoutes.claims.deleteMedia(claim.id, mid)}
                initialDocuments={claim.insurance_documents}
                accept="application/pdf,image/*"
                onRefresh={() => qc.invalidateQueries({ queryKey: claimKeys.detail(claim.id) })}
              />
            </div>
          )}
        </form>
      </Form>
    </PageContainer>
  );
}
