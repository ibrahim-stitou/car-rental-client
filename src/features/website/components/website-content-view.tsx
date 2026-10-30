'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/page-header';
import type { Translatable, WebsiteContent } from '@/types/website.types';
import { useUpdateWebsiteContent, useWebsiteContent } from '../hooks/use-website';
import { cleanTranslatable, toastWebsiteError } from '../utils';
import { TranslatableField, toTranslatable } from './translatable-field';

const TEXTS: { key: keyof WebsiteContent; label: string; multiline?: boolean; description?: string }[] = [
  { key: 'title', label: 'Nom du site' },
  { key: 'subtitle', label: "Slogan" },
  { key: 'hero_description', label: "Texte d'accueil", multiline: true },
  { key: 'about_title', label: 'Titre « À propos »' },
  { key: 'about_description', label: 'Texte « À propos »', multiline: true },
  { key: 'response_time_text', label: 'Délai de réponse affiché', description: 'Montré après l’envoi d’une demande.' },
  { key: 'delivery_fee_notice', label: 'Mention frais de livraison' },
  { key: 'one_way_fee_notice', label: 'Mention frais de retour dans une autre agence' },
  { key: 'meta_description', label: 'Description pour les moteurs de recherche', multiline: true },
];

const PLAIN: { key: keyof WebsiteContent; label: string; placeholder?: string }[] = [
  { key: 'contact_phone', label: 'Téléphone' },
  { key: 'whatsapp_number', label: 'WhatsApp', placeholder: '+212 6…' },
  { key: 'contact_email', label: 'E-mail' },
  { key: 'contact_address', label: 'Adresse' },
  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://' },
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://' },
  { key: 'twitter_url', label: 'X (Twitter)', placeholder: 'https://' },
  { key: 'meta_keywords', label: 'Mots-clés (SEO)' },
];

type FormValues = Record<string, Translatable | string | boolean>;

export function WebsiteContentView() {
  const { data: res, isLoading } = useWebsiteContent();
  const updateMutation = useUpdateWebsiteContent();
  const form = useForm<FormValues>();
  const { register, control, handleSubmit, reset, formState: { isDirty } } = form;

  useEffect(() => {
    const c = res?.data;
    if (!c) return;
    reset({
      ...Object.fromEntries(TEXTS.map(({ key }) => [key, toTranslatable(c[key] as Translatable | string | null)])),
      ...Object.fromEntries(PLAIN.map(({ key }) => [key, (c[key] as string | null) ?? ''])),
      primary_color: c.primary_color ?? '',
      booking_enabled: c.booking_enabled ?? true,
      show_prices: c.show_prices ?? true,
    });
  }, [res, reset]);

  const onSubmit = (v: FormValues) => {
    const payload: WebsiteContent = {
      ...Object.fromEntries(TEXTS.map(({ key }) => [key, cleanTranslatable(v[key] as Translatable)])),
      ...Object.fromEntries(PLAIN.map(({ key }) => [key, (v[key] as string)?.trim() || null])),
      primary_color: (v.primary_color as string) || null,
      booking_enabled: !!v.booking_enabled,
      show_prices: !!v.show_prices,
    };
    updateMutation.mutate(payload, {
      onSuccess: (r) => toast.success(r.message ?? 'Contenu enregistré'),
      onError: (err) => toastWebsiteError(err, "Échec de l'enregistrement"),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Contenu du site"
        description="Textes, coordonnées et réglages généraux du site public"
        actions={
          <Button type="submit" size="sm" disabled={updateMutation.isPending || !isDirty}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Enregistrer
          </Button>
        }
      />

      {isLoading ? <Skeleton className="h-96" /> : (
        <div className="grid lg:grid-cols-3 gap-4 items-start">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Textes</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {TEXTS.map(({ key, label, multiline, description }) => (
                <Controller key={key} control={control} name={key} render={({ field }) => (
                  <TranslatableField label={label} description={description} value={field.value as Translatable}
                    onChange={field.onChange} multiline={multiline} rows={3} maxLength={3000} />
                )} />
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Réservation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Controller control={control} name="booking_enabled" render={({ field }) => (
                  <label className="flex items-start justify-between gap-3 text-sm">
                    <span>
                      Demandes de réservation ouvertes
                      <span className="block text-xs text-muted-foreground">Désactivé : le site affiche le catalogue sans formulaire.</span>
                    </span>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </label>
                )} />
                <Controller control={control} name="show_prices" render={({ field }) => (
                  <label className="flex items-start justify-between gap-3 text-sm">
                    <span>
                      Afficher les prix
                      <span className="block text-xs text-muted-foreground">Désactivé : « Prix sur demande ».</span>
                    </span>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </label>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Coordonnées et réseaux</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {PLAIN.map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Input placeholder={placeholder} {...register(key)} />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label>Couleur principale</Label>
                  <Input placeholder="#1d4ed8" {...register('primary_color')} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </form>
  );
}
