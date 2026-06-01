'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateAgency, useUpdateAgency } from '../hooks/use-agencies';
import type { Agency } from '@/types/agency.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'Ville is required'),
  country: z.string().min(1, 'Country is required'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agency?: Agency | null;
  onSuccess?: () => void;
}

export function AgencyForm({ open, onOpenChange, agency, onSuccess }: Props) {
  const createMutation = useCreateAgency();
  const updateMutation = useUpdateAgency(agency?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', address: '', city: '', country: 'Morocco' },
  });

  useEffect(() => {
    if (agency) {
      form.reset({ name: agency.name, email: agency.email, phone: agency.phone, address: agency.address, city: agency.city, country: agency.country });
    } else {
      form.reset({ name: '', email: '', phone: '', address: '', city: '', country: 'Morocco' });
    }
  }, [agency, form, open]);

  const onSubmit = (values: FormValues) => {
    if (agency) {
      updateMutation.mutate(values, {
        onSuccess: () => { toast.success('Agence mise à jour'); onOpenChange(false); onSuccess?.(); },
        onError: () => toast.error('Échec de la mise à jour agency'),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => { toast.success('Agence créée'); onOpenChange(false); form.reset(); onSuccess?.(); },
        onError: () => toast.error('Impossible de créer agency'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{agency ? "Modifier l'agence" : 'Ajouter une agence'}</SheetTitle>
          <SheetDescription>{agency ? "Mettre à jour les informations de l'agence" : 'Créer une nouvelle agence de location'}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nom de l'agence *</FormLabel><FormControl><Input placeholder="Agence Casablanca" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" placeholder="contact@agency.ma" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Téléphone *</FormLabel><FormControl><Input placeholder="+212 5XX XXX XXX" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Localisation</p>

              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Adresse *</FormLabel><FormControl><Input placeholder="123 Boulevard Mohammed V" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>Ville *</FormLabel><FormControl><Input placeholder="Casablanca" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Pays *</FormLabel><FormControl><Input placeholder="Morocco" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : agency ? 'Update Agency' : 'Create Agency'}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
