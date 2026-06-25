'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useSettingGroup, useUpdateSettings } from '../hooks/use-settings';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageContainer from '@/components/layout/page-container';

const COMPANY_TYPES = [
  { value: 'SARL', label: 'SARL' },
  { value: 'SARL AU', label: 'SARL AU' },
  { value: 'SA', label: 'SA' },
  { value: 'SNC', label: 'SNC' },
  { value: 'SAS', label: 'SAS' },
  { value: 'Personne Physique', label: 'Personne Physique' },
];

const schema = z.object({
  name: z.string().min(1, 'Nom de la société requis'),
  tagline: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  website: z.string().optional(),
  ice: z.string().optional(),
  rc: z.string().optional(),
  cnss: z.string().optional(),
  if: z.string().optional(),
  patent: z.string().optional(),
  capital: z.string().optional(),
  company_type: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  bank_rib: z.string().optional(),
  bank_swift: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CompanySettingsView() {
  const { data, isLoading } = useSettingGroup('company');
  const updateSettings = useUpdateSettings('company');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', tagline: '', email: '', phone: '', phone2: '',
      address: '', city: '', country: 'Maroc', postal_code: '', website: '',
      ice: '', rc: '', cnss: '', if: '', patent: '', capital: '', company_type: '',
      bank_name: '', bank_account: '', bank_rib: '', bank_swift: '',
    },
  });

  useEffect(() => {
    const s = (data as any)?.data ?? {};
    if (!s.name && !s.email) return;
    form.reset({
      name: s.name ?? '',
      tagline: s.tagline ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      phone2: s.phone2 ?? '',
      address: s.address ?? '',
      city: s.city ?? '',
      country: s.country ?? 'Maroc',
      postal_code: s.postal_code ?? '',
      website: s.website ?? '',
      ice: s.ice ?? '',
      rc: s.rc ?? '',
      cnss: s.cnss ?? '',
      if: s.if ?? '',
      patent: s.patent ?? '',
      capital: s.capital ?? '',
      company_type: s.company_type ?? '',
      bank_name: s.bank_name ?? '',
      bank_account: s.bank_account ?? '',
      bank_rib: s.bank_rib ?? '',
      bank_swift: s.bank_swift ?? '',
    });
  }, [data, form]);

  const onSubmit = async (values: FormValues) => {
    updateSettings.mutate(values as any, {
      onSuccess: () => toast.success('Paramètres enregistrés'),
      onError: () => toast.error("Impossible d'enregistrer les paramètres"),
    });
  };

  return (
    <PageContainer scrollable>
      <div className="p-6 w-full space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings"><ArrowLeft className="h-4 w-4 mr-1" />Paramètres</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Paramètres d&apos;Entreprise</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Informations légales, fiscales et bancaires</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Informations générales */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nom de la société *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="tagline" render={({ field }) => (
                      <FormItem><FormLabel>Slogan</FormLabel><FormControl><Input placeholder="Location de véhicules à votre service" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="website" render={({ field }) => (
                      <FormItem><FormLabel>Site web</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Téléphone principal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone2" render={({ field }) => (
                      <FormItem><FormLabel>Téléphone secondaire</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Separator />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem className="col-span-2"><FormLabel>Ville</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="postal_code" render={({ field }) => (
                      <FormItem><FormLabel>Code postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem><FormLabel>Pays</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              {/* Identifiants légaux et fiscaux */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Identifiants légaux et fiscaux</CardTitle>
                  <CardDescription>Informations réglementaires marocaines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="company_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forme juridique</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMPANY_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="capital" render={({ field }) => (
                      <FormItem><FormLabel>Capital social</FormLabel><FormControl><Input placeholder="ex : 100 000 MAD" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="ice" render={({ field }) => (
                      <FormItem><FormLabel>ICE</FormLabel><FormControl><Input placeholder="Identifiant Commun de l'Entreprise" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="rc" render={({ field }) => (
                      <FormItem><FormLabel>RC</FormLabel><FormControl><Input placeholder="Registre de Commerce" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="if" render={({ field }) => (
                      <FormItem><FormLabel>IF</FormLabel><FormControl><Input placeholder="Identifiant Fiscal" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="patent" render={({ field }) => (
                      <FormItem><FormLabel>Patente</FormLabel><FormControl><Input placeholder="Numéro de patente" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="cnss" render={({ field }) => (
                      <FormItem><FormLabel>CNSS</FormLabel><FormControl><Input placeholder="N° CNSS" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              {/* Informations bancaires */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations bancaires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="bank_name" render={({ field }) => (
                      <FormItem><FormLabel>Nom de la banque</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="bank_account" render={({ field }) => (
                      <FormItem><FormLabel>Numéro de compte</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="bank_rib" render={({ field }) => (
                      <FormItem><FormLabel>RIB</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="bank_swift" render={({ field }) => (
                      <FormItem><FormLabel>Code SWIFT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateSettings.isPending} size="lg">
                  {updateSettings.isPending ? 'Enregistrement…' : 'Enregistrer les paramètres'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </PageContainer>
  );
}
