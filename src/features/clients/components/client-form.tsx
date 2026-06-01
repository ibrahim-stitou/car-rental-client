'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateClient, useUpdateClient } from '../hooks/use-clients';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import type { Client } from '@/types/client.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const schema = z.object({
  agency_id: z.string().min(1, 'Agency is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required'),
  date_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  id_type: z.enum(['CIN', 'Passport', 'Residence Permit']).optional(),
  id_number: z.string().optional(),
  id_expiry_date: z.string().optional(),
  driving_license_number: z.string().optional(),
  driving_license_category: z.string().optional(),
  driving_license_expiry: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSuccess?: () => void;
}

export function ClientForm({ open, onOpenChange, client, onSuccess }: Props) {
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient(client?.id ?? '');
  const { data: agenciesRes } = useAgencies({ per_page: 100 });
  const agencies = agenciesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      agency_id: '', first_name: '', last_name: '', email: '', phone: '',
      date_of_birth: '', nationality: '', id_type: undefined, id_number: '',
      id_expiry_date: '', driving_license_number: '', driving_license_category: '',
      driving_license_expiry: '', address: '', city: '', country: '', notes: '',
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        agency_id: client.agency_id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email ?? '',
        phone: client.phone,
        date_of_birth: client.date_of_birth ?? '',
        nationality: client.nationality ?? '',
        id_type: client.id_type ?? undefined,
        id_number: client.id_number ?? '',
        id_expiry_date: client.id_expiry_date ?? '',
        driving_license_number: client.driving_license_number ?? '',
        driving_license_category: client.driving_license_category ?? '',
        driving_license_expiry: client.driving_license_expiry ?? '',
        address: client.address ?? '',
        city: client.city ?? '',
        country: client.country ?? '',
        notes: client.notes ?? '',
      });
    } else {
      form.reset({
        agency_id: '', first_name: '', last_name: '', email: '', phone: '',
        date_of_birth: '', nationality: '', id_type: undefined, id_number: '',
        id_expiry_date: '', driving_license_number: '', driving_license_category: '',
        driving_license_expiry: '', address: '', city: '', country: '', notes: '',
      });
    }
  }, [client, form, open]);

  const onSubmit = (values: FormValues) => {
    const payload = { ...values, email: values.email || undefined };
    if (client) {
      updateMutation.mutate(payload as any, {
        onSuccess: () => { toast.success('Client mis à jour'); onOpenChange(false); onSuccess?.(); },
        onError: () => toast.error('Échec de la mise à jour'),
      });
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: () => { toast.success('Client créé'); onOpenChange(false); form.reset(); onSuccess?.(); },
        onError: () => toast.error('Impossible de créer le client'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{client ? 'Modifier le client' : 'Ajouter un client'}</SheetTitle>
          <SheetDescription>
            {client ? 'Mettre à jour les informations du client' : 'Enregistrer un nouveau client'}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
              <FormField control={form.control} name="agency_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Agence *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Sélectionner une agence" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {agencies.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Informations personnelles</p>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl><Input placeholder="Mohamed" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl><Input placeholder="Alami" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone *</FormLabel>
                    <FormControl><Input placeholder="+212 6XX XXX XXX" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="client@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nationality" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationalité</FormLabel>
                    <FormControl><Input placeholder="Moroccan" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Pièce d'identité</p>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="id_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de pièce</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CIN">CIN</SelectItem>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="Residence Permit">Residence Permit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="id_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro</FormLabel>
                    <FormControl><Input placeholder="AB123456" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="id_expiry_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Permis de conduire</p>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="driving_license_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° de permis</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="driving_license_category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <FormControl><Input placeholder="B" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="driving_license_expiry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Adresse</p>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Adresse</FormLabel>
                    <FormControl><Input placeholder="123 Rue Hassan II" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl><Input placeholder="Casablanca" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <FormControl><Input placeholder="Morocco" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarques</FormLabel>
                  <FormControl><Textarea placeholder="Additional information…" rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Enregistrement…' : client ? 'Update Client' : 'Create Client'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
