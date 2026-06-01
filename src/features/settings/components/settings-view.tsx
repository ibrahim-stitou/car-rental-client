'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  company_email: z.string().email().optional().or(z.literal('')),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
  company_city: z.string().optional(),
  company_country: z.string().optional(),
  company_website: z.string().optional(),
  tax_number: z.string().optional(),
  currency: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SettingsView() {
  const [loading, setLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: '', company_email: '', company_phone: '',
      company_address: '', company_city: '', company_country: 'Morocco',
      company_website: '', tax_number: '', currency: 'MAD',
    },
  });

  useEffect(() => {
    apiClient.get(apiRoutes.settings.all)
      .then((r) => {
        const settings = r.data?.data ?? {};
        const vals: Record<string, string> = {};
        (Array.isArray(settings) ? settings : Object.entries(settings)).forEach((item: any) => {
          if (item.key) vals[item.key] = item.value ?? '';
          else if (Array.isArray(item) && item.length === 2) vals[item[0]] = item[1];
        });
        form.reset({
          company_name: vals.company_name ?? '',
          company_email: vals.company_email ?? '',
          company_phone: vals.company_phone ?? '',
          company_address: vals.company_address ?? '',
          company_city: vals.company_city ?? '',
          company_country: vals.company_country ?? 'Morocco',
          company_website: vals.company_website ?? '',
          tax_number: vals.tax_number ?? '',
          currency: vals.currency ?? 'MAD',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      await apiClient.put(apiRoutes.settings.updateGroup('general'), values);
      toast.success('Paramètres enregistrés');
    } catch {
      toast.error("Impossible d'enregistrer les paramètres");
    }
  };

  return (
    <div className="p-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">Configuration de la société</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la société</CardTitle>
          <CardDescription>Informations de base de votre société de location</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="company_name" render={({ field }) => (
                  <FormItem><FormLabel>Nom de la société *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="company_email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="company_phone" render={({ field }) => (
                    <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="company_address" render={({ field }) => (
                  <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="company_city" render={({ field }) => (
                    <FormItem><FormLabel>Ville</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="company_country" render={({ field }) => (
                    <FormItem><FormLabel>Pays</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="tax_number" render={({ field }) => (
                    <FormItem><FormLabel>N° ICE / Taxe</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>Devise</FormLabel><FormControl><Input placeholder="MAD" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="company_website" render={({ field }) => (
                  <FormItem><FormLabel>Site web</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
