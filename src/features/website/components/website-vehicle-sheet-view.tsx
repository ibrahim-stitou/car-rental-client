'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Loader2, Save } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SelectField } from '@/components/shared/select-field';
import type { Translatable, UpdateWebsiteVehicleInput, VehicleFeature, WebsiteVehicle } from '@/types/website.types';
import {
  useCopyWebsiteVehicle, usePublishWebsiteVehicle, useUpdateWebsiteVehicle, useWebsiteVehicle, useWebsiteVehicles,
} from '../hooks/use-website';
import { VEHICLE_FEATURES } from '../constants';
import { cleanTranslatable, formatMad, toastWebsiteError } from '../utils';
import { TranslatableField } from './translatable-field';
import { ChecklistCard } from './checklist-card';
import { PhotoManager } from './photo-manager';

const optionalInt = z.string().regex(/^\d*$/, 'Nombre entier attendu');
const optionalAmount = z.string().regex(/^\d*([.,]\d{0,2})?$/, 'Montant invalide');

const schema = z.object({
  website_slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Minuscules, chiffres et tirets uniquement'),
  website_title: z.record(z.string().nullable()),
  website_short_description: z.record(z.string().nullable()),
  website_long_description: z.record(z.string().nullable()),
  doors: optionalInt,
  luggage_large: optionalInt,
  luggage_small: optionalInt,
  has_ac: z.boolean(),
  features: z.array(z.string()),
  website_featured: z.boolean(),
  website_sort_order: optionalInt,
  website_price_override: optionalAmount,
  website_deposit_amount: optionalAmount,
  min_driver_age: optionalInt,
  min_license_years: optionalInt,
  mileage_policy: z.enum(['default', 'unlimited', 'limited']),
  mileage_limit_per_day: optionalInt,
}).refine((v) => v.mileage_policy !== 'limited' || !!v.mileage_limit_per_day, {
  path: ['mileage_limit_per_day'], message: 'Indiquez le kilométrage inclus par jour',
});

type FormValues = z.infer<typeof schema>;

const str = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));
const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

function toFormValues(v: WebsiteVehicle): FormValues {
  return {
    website_slug: v.website_slug ?? '',
    website_title: v.website_title ?? {},
    website_short_description: v.website_short_description ?? {},
    website_long_description: v.website_long_description ?? {},
    doors: str(v.doors),
    luggage_large: str(v.luggage_large),
    luggage_small: str(v.luggage_small),
    has_ac: v.has_ac ?? true,
    features: v.features ?? [],
    website_featured: v.website_featured ?? false,
    website_sort_order: str(v.website_sort_order),
    // En prod, un override à 0 signifie « pas de prix web spécifique »
    website_price_override: v.website_price_override ? String(v.website_price_override) : '',
    website_deposit_amount: str(v.website_deposit_amount),
    min_driver_age: str(v.min_driver_age),
    min_license_years: str(v.min_license_years),
    mileage_policy: v.mileage_policy ?? 'default',
    mileage_limit_per_day: str(v.mileage_limit_per_day),
  };
}

function toPayload(values: FormValues): UpdateWebsiteVehicleInput {
  return {
    website_slug: values.website_slug,
    website_title: cleanTranslatable(values.website_title as Translatable),
    website_short_description: cleanTranslatable(values.website_short_description as Translatable),
    website_long_description: cleanTranslatable(values.website_long_description as Translatable),
    doors: num(values.doors),
    luggage_large: num(values.luggage_large),
    luggage_small: num(values.luggage_small),
    has_ac: values.has_ac,
    features: values.features as VehicleFeature[],
    website_featured: values.website_featured,
    website_sort_order: num(values.website_sort_order),
    website_price_override: num(values.website_price_override),
    website_deposit_amount: num(values.website_deposit_amount),
    min_driver_age: num(values.min_driver_age),
    min_license_years: num(values.min_license_years),
    mileage_policy: values.mileage_policy === 'default' ? null : values.mileage_policy,
    mileage_limit_per_day: values.mileage_policy === 'limited' ? num(values.mileage_limit_per_day) : null,
  };
}

export function WebsiteVehicleSheetView({ vehicleId }: { vehicleId: string }) {
  const { data: res, isLoading } = useWebsiteVehicle(vehicleId);
  const vehicle = res?.data;

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div></PageContainer>;
  }
  if (!vehicle) {
    return <PageContainer><div className="p-6 text-muted-foreground">Véhicule introuvable.</div></PageContainer>;
  }

  return <VehicleSheet vehicle={vehicle} />;
}

/**
 * The form is filled once on mount: later refetches (photo upload,
 * publication) refresh the photos and the checklist without touching
 * unsaved edits. It is reset explicitly after a save or a sheet copy.
 */
function VehicleSheet({ vehicle }: { vehicle: WebsiteVehicle }) {
  const updateMutation = useUpdateWebsiteVehicle(vehicle.id);
  const publishMutation = usePublishWebsiteVehicle(vehicle.id);
  const [copyOpen, setCopyOpen] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(vehicle) });
  const { register, control, handleSubmit, watch, formState: { errors, isDirty } } = form;

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(toPayload(values), {
      onSuccess: (r) => { form.reset(toFormValues(r.data)); toast.success(r.message ?? 'Fiche web enregistrée'); },
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

  const mileagePolicy = watch('mileage_policy');
  const priceOverride = num(watch('website_price_override') ?? '');

  return (
    <PageContainer scrollable>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/website/vehicles"><ArrowLeft className="h-4 w-4 mr-1" />Véhicules du site</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{vehicle.full_name}</h1>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono">{vehicle.registration_number}</span>
                {vehicle.agency && <> · {vehicle.agency.name}</>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setCopyOpen(true)}>
              <Copy className="h-4 w-4 mr-1.5" />Copier une fiche
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Enregistrer
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Textes de la page</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="website_slug">Adresse de la page</Label>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-muted-foreground shrink-0">/voitures/</span>
                    <Input id="website_slug" {...register('website_slug')} className="font-mono" />
                  </div>
                  {errors.website_slug && <p className="text-sm text-destructive">{errors.website_slug.message}</p>}
                </div>
                <Controller control={control} name="website_title" render={({ field }) => (
                  <TranslatableField label="Titre" value={field.value} onChange={field.onChange} maxLength={120} required={['fr', 'ar', 'en']} />
                )} />
                <Controller control={control} name="website_short_description" render={({ field }) => (
                  <TranslatableField label="Accroche" description="Une ou deux phrases affichées sur la carte du véhicule."
                    value={field.value} onChange={field.onChange} multiline rows={2} maxLength={300} required={['fr', 'ar', 'en']} />
                )} />
                <Controller control={control} name="website_long_description" render={({ field }) => (
                  <TranslatableField label="Description complète" value={field.value} onChange={field.onChange} multiline rows={5} maxLength={5000} />
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Caractéristiques et équipements</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5"><Label>Portes</Label><Input inputMode="numeric" {...register('doors')} /></div>
                  <div className="space-y-1.5"><Label>Grandes valises</Label><Input inputMode="numeric" {...register('luggage_large')} /></div>
                  <div className="space-y-1.5"><Label>Petits bagages</Label><Input inputMode="numeric" {...register('luggage_small')} /></div>
                  <div className="space-y-1.5">
                    <Label>Climatisation</Label>
                    <Controller control={control} name="has_ac" render={({ field }) => (
                      <div className="flex h-9 items-center"><Switch checked={!!field.value} onCheckedChange={field.onChange} /></div>
                    )} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Repris de la fiche véhicule : {[vehicle.category, vehicle.transmission, vehicle.fuel_type, vehicle.seats && `${vehicle.seats} places`].filter(Boolean).join(' · ') || '—'}
                </p>

                <Controller control={control} name="features" render={({ field }) => (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {VEHICLE_FEATURES.map((f) => {
                      const checked = field.value?.includes(f.value) ?? false;
                      return (
                        <label key={f.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => field.onChange(c ? [...(field.value ?? []), f.value] : (field.value ?? []).filter((x) => x !== f.value))}
                          />
                          {f.label}
                        </label>
                      );
                    })}
                  </div>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Prix et conditions</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Prix affiché sur le site (MAD / jour)</Label>
                    <Input inputMode="decimal" placeholder={String(vehicle.daily_rate)} {...register('website_price_override')} />
                    <p className="text-xs text-muted-foreground">
                      Vide = tarif de base ({formatMad(vehicle.daily_rate)}). Prix affiché : <strong>{formatMad(priceOverride && priceOverride > 0 ? priceOverride : vehicle.daily_rate)}</strong>
                    </p>
                    {errors.website_price_override && <p className="text-sm text-destructive">{errors.website_price_override.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Caution affichée (MAD)</Label>
                    <Input inputMode="decimal" placeholder={String(vehicle.deposit_amount || '')} {...register('website_deposit_amount')} />
                    <p className="text-xs text-muted-foreground">Vide = caution du véhicule, sinon celle des conditions générales.</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">Laissez vide pour appliquer les conditions générales du site.</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5"><Label>Âge minimum</Label><Input inputMode="numeric" {...register('min_driver_age')} /></div>
                  <div className="space-y-1.5"><Label>Permis depuis (ans)</Label><Input inputMode="numeric" {...register('min_license_years')} /></div>
                  <div className="space-y-1.5">
                    <Label>Kilométrage</Label>
                    <Controller control={control} name="mileage_policy" render={({ field }) => (
                      <Select value={field.value} onValueChange={(v) => { /* Radix emits '' on mount inside a form */ if (v) field.onChange(v); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Conditions générales</SelectItem>
                          <SelectItem value="unlimited">Illimité</SelectItem>
                          <SelectItem value="limited">Limité</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  {mileagePolicy === 'limited' && (
                    <div className="space-y-1.5">
                      <Label>Km inclus / jour</Label>
                      <Input inputMode="numeric" {...register('mileage_limit_per_day')} />
                      {errors.mileage_limit_per_day && <p className="text-sm text-destructive">{errors.mileage_limit_per_day.message}</p>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <PhotoManager type="vehicles" ownerId={vehicle.id} photos={vehicle.photos} minimum={4} />
          </div>

          <div className="space-y-4 lg:sticky lg:top-4">
            <ChecklistCard
              checklist={vehicle.checklist}
              published={vehicle.show_on_website}
              publicUrl={vehicle.public_url}
              onPublish={handlePublish}
              isPending={publishMutation.isPending}
            />

            <Card>
              <CardHeader><CardTitle className="text-base">Mise en avant</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Controller control={control} name="website_featured" render={({ field }) => (
                  <label className="flex items-center justify-between gap-2 text-sm">
                    Afficher en page d&apos;accueil
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </label>
                )} />
                <div className="space-y-1.5">
                  <Label>Ordre d&apos;affichage</Label>
                  <Input inputMode="numeric" placeholder="0 = en premier" {...register('website_sort_order')} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <CopySheetDialog open={copyOpen} onOpenChange={setCopyOpen} vehicle={vehicle} onCopied={(copied) => form.reset(toFormValues(copied))} />
    </PageContainer>
  );
}

function CopySheetDialog({ open, onOpenChange, vehicle, onCopied }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  vehicle: WebsiteVehicle;
  onCopied: (copied: WebsiteVehicle) => void;
}) {
  const [search, setSearch] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [withPhotos, setWithPhotos] = useState(true);
  const { data: listRes } = useWebsiteVehicles({ per_page: 50, search: search || undefined, include_inactive: true });
  const copyMutation = useCopyWebsiteVehicle(vehicle.id);

  const options = useMemo(() => (listRes?.data ?? [])
    .filter((v) => v.id !== vehicle.id)
    .map((v) => ({ value: v.id, label: v.full_name, sub: `${v.registration_number} · fiche ${v.checklist.score} %` })), [listRes, vehicle.id]);

  const handleCopy = () => {
    copyMutation.mutate({ sourceId, withPhotos }, {
      onSuccess: (r) => { onCopied(r.data); toast.success(r.message ?? 'Fiche copiée'); onOpenChange(false); setSourceId(''); },
      onError: (err) => toastWebsiteError(err, 'Copie impossible'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copier la fiche d&apos;un autre véhicule</DialogTitle>
          <DialogDescription>
            Pratique pour un véhicule identique : les textes, équipements et conditions sont repris. L&apos;adresse de la page reste celle de ce véhicule.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <SelectField value={sourceId} onChange={setSourceId} options={options} onSearchChange={setSearch} placeholder="Véhicule source…" />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={withPhotos} onCheckedChange={(c) => setWithPhotos(!!c)} />
            Copier aussi les photos
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleCopy} disabled={!sourceId || copyMutation.isPending}>
            {copyMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Copier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
