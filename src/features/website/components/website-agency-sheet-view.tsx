'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { OpeningHours, Translatable, UpdateWebsiteAgencyInput, WebsiteAgency } from '@/types/website.types';
import { usePublishWebsiteAgency, useUpdateWebsiteAgency, useWebsiteAgency } from '../hooks/use-website';
import { AGENCY_SERVICES } from '../constants';
import { cleanTranslatable, toastWebsiteError } from '../utils';
import { TranslatableField } from './translatable-field';
import { ChecklistCard } from './checklist-card';
import { PhotoManager } from './photo-manager';
import { OpeningHoursEditor } from './opening-hours-editor';
import { PickupPointsCard } from './pickup-points-card';

const LocationMap = dynamic(() => import('./location-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full" />,
});

const coordinate = z.string().regex(/^-?\d*([.,]\d*)?$/, 'Coordonnée invalide');

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Minuscules, chiffres et tirets uniquement'),
  website_description: z.record(z.string().nullable()),
  latitude: coordinate,
  longitude: coordinate,
  google_maps_url: z.string().url('Lien invalide').or(z.literal('')),
  whatsapp: z.string().max(30),
  opening_hours: z.record(z.array(z.object({ open: z.string(), close: z.string() }))),
  services: z.array(z.string()),
  website_sort_order: z.string().regex(/^\d*$/, 'Nombre entier attendu'),
});

type FormValues = z.infer<typeof schema>;

const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

function toFormValues(a: WebsiteAgency): FormValues {
  return {
    slug: a.slug ?? '',
    website_description: a.website_description ?? {},
    latitude: a.latitude !== null ? String(a.latitude) : '',
    longitude: a.longitude !== null ? String(a.longitude) : '',
    google_maps_url: a.google_maps_url ?? '',
    whatsapp: a.whatsapp ?? '',
    opening_hours: (a.opening_hours ?? {}) as FormValues['opening_hours'],
    services: a.services ?? [],
    website_sort_order: a.website_sort_order !== null ? String(a.website_sort_order) : '',
  };
}

function toPayload(v: FormValues): UpdateWebsiteAgencyInput {
  return {
    slug: v.slug,
    website_description: cleanTranslatable(v.website_description as Translatable),
    latitude: num(v.latitude),
    longitude: num(v.longitude),
    google_maps_url: v.google_maps_url || null,
    whatsapp: v.whatsapp || null,
    opening_hours: v.opening_hours as OpeningHours,
    services: v.services,
    website_sort_order: num(v.website_sort_order),
  };
}

export function WebsiteAgencySheetView({ agencyId }: { agencyId: string }) {
  const { data: res, isLoading } = useWebsiteAgency(agencyId);
  const agency = res?.data;
  const updateMutation = useUpdateWebsiteAgency(agencyId);
  const publishMutation = usePublishWebsiteAgency(agencyId);

  // Same as the vehicle sheet: filled from the first render, unsaved edits kept on refetch
  const values = useMemo(() => (agency ? toFormValues(agency) : undefined), [agency]);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), values, resetOptions: { keepDirtyValues: true } });
  const { register, control, handleSubmit, watch, setValue, formState: { errors, isDirty } } = form;

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div></PageContainer>;
  }
  if (!agency) {
    return <PageContainer><div className="p-6 text-muted-foreground">Agence introuvable.</div></PageContainer>;
  }

  const lat = num(watch('latitude') ?? '');
  const lng = num(watch('longitude') ?? '');
  const position = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : null;

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(toPayload(values), {
      onSuccess: (r) => { form.reset(toFormValues(r.data)); toast.success(r.message ?? 'Présentation enregistrée'); },
      onError: (err) => toastWebsiteError(err, "Échec de l'enregistrement"),
    });
  };

  const handlePublish = (publish: boolean) => {
    if (publish && isDirty) {
      toast.warning('Enregistrez vos modifications avant de publier.');
      return;
    }
    publishMutation.mutate(publish, {
      onSuccess: (r) => toast.success(r.message),
      onError: (err) => toastWebsiteError(err, 'Publication impossible'),
    });
  };

  const customServices = (watch('services') ?? []).filter((s) => !AGENCY_SERVICES.some((x) => x.value === s));

  return (
    <PageContainer scrollable>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/website/agencies"><ArrowLeft className="h-4 w-4 mr-1" />Agences du site</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{agency.name}</h1>
              <p className="text-sm text-muted-foreground">{[agency.address, agency.city].filter(Boolean).join(', ') || '—'}</p>
            </div>
          </div>
          <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Enregistrer
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Présentation</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Adresse de la page</Label>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-muted-foreground shrink-0">/agences/</span>
                    <Input id="slug" {...register('slug')} className="font-mono" />
                  </div>
                  {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                </div>
                <Controller control={control} name="website_description" render={({ field }) => (
                  <TranslatableField label="Description" value={field.value} onChange={field.onChange} multiline rows={4} maxLength={3000} required={['fr', 'ar', 'en']} />
                )} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>WhatsApp</Label>
                    <Input placeholder="+212 6…" {...register('whatsapp')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ordre d&apos;affichage</Label>
                    <Input inputMode="numeric" {...register('website_sort_order')} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adresse, téléphone et e-mail viennent de la fiche agence ({agency.phone ?? 'pas de téléphone'}).{' '}
                  <Link href={`/agencies/${agency.id}`} className="underline">Voir la fiche agence</Link>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Position sur la carte</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Cliquez sur la carte pour placer l&apos;agence, puis déplacez le repère si besoin.</p>
                <LocationMap
                  value={position}
                  onChange={({ lat: la, lng: lo }) => {
                    setValue('latitude', String(la), { shouldDirty: true });
                    setValue('longitude', String(lo), { shouldDirty: true });
                  }}
                />
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label>Latitude</Label><Input {...register('latitude')} /></div>
                  <div className="space-y-1.5"><Label>Longitude</Label><Input {...register('longitude')} /></div>
                  <div className="space-y-1.5">
                    <Label>Lien Google Maps</Label>
                    <Input placeholder="https://maps.google.com/…" {...register('google_maps_url')} />
                    {errors.google_maps_url && <p className="text-sm text-destructive">{errors.google_maps_url.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Horaires d&apos;ouverture</CardTitle></CardHeader>
              <CardContent>
                <Controller control={control} name="opening_hours" render={({ field }) => (
                  <OpeningHoursEditor value={(field.value ?? {}) as OpeningHours} onChange={field.onChange} />
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Services</CardTitle></CardHeader>
              <CardContent>
                <Controller control={control} name="services" render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[...AGENCY_SERVICES, ...customServices.map((s) => ({ value: s, label: s }))].map((s) => (
                      <label key={s.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                        <Checkbox
                          checked={field.value?.includes(s.value) ?? false}
                          onCheckedChange={(c) => field.onChange(c ? [...(field.value ?? []), s.value] : (field.value ?? []).filter((x) => x !== s.value))}
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                )} />
              </CardContent>
            </Card>

            <PhotoManager type="agencies" ownerId={agency.id} photos={agency.photos} minimum={1} />
            <PickupPointsCard agencyId={agency.id} points={agency.pickup_points} />
          </div>

          <div className="space-y-4 lg:sticky lg:top-4">
            <ChecklistCard
              checklist={agency.checklist}
              published={agency.show_on_website}
              publicUrl={agency.public_url}
              onPublish={handlePublish}
              isPending={publishMutation.isPending}
            />
            {agency.show_on_website && (
              <p className="text-xs text-muted-foreground px-1">
                Retirer l&apos;agence du site masque aussi tous ses véhicules publiés.
              </p>
            )}
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
