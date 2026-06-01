'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateUser, useUpdateUser } from '../hooks/use-users';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import type { User } from '@/types/user.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { USER_ROLE_OPTIONS } from '@/config/constants';

const createSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(8),
  phone: z.string().optional(),
  agency_id: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
}).refine((d) => d.password === d.password_confirmation, { message: 'Passwords do not match', path: ['password_confirmation'] });

const editSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  agency_id: z.string().optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess?: () => void;
}

export function UserForm({ open, onOpenChange, user, onSuccess }: Props) {
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(user?.id ?? '');
  const { data: agenciesRes } = useAgencies({ per_page: 100 });
  const agencies = agenciesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', password_confirmation: '', phone: '', agency_id: '', role: 'agent' },
  });
  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: { first_name: '', last_name: '', email: '', phone: '', agency_id: '' },
  });

  useEffect(() => {
    if (user) {
      editForm.reset({ first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone ?? '', agency_id: user.agency_id ?? '' });
    } else {
      createForm.reset({ first_name: '', last_name: '', email: '', password: '', password_confirmation: '', phone: '', agency_id: '', role: 'agent' });
    }
  }, [user, open]);

  const onSubmitCreate = (values: z.infer<typeof createSchema>) => {
    createMutation.mutate(values as any, {
      onSuccess: () => { toast.success('Utilisateur créé'); onOpenChange(false); createForm.reset(); onSuccess?.(); },
      onError: () => toast.error('Impossible de créer user'),
    });
  };

  const onSubmitEdit = (values: z.infer<typeof editSchema>) => {
    updateMutation.mutate(values, {
      onSuccess: () => { toast.success('Utilisateur mis à jour'); onOpenChange(false); onSuccess?.(); },
      onError: () => toast.error('Échec de la mise à jour user'),
    });
  };

  if (user) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Modifier l'utilisateur</SheetTitle>
            <SheetDescription>Mettre à jour les informations</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-140px)]">
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={editForm.control} name="first_name" render={({ field }) => (<FormItem><FormLabel>Prénom *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={editForm.control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Nom *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={editForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editForm.control} name="agency_id" render={({ field }) => (
                  <FormItem><FormLabel>Agency</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sans agence" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">Sans agence</SelectItem>
                        {agencies.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                  <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : 'Update User'}</Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Ajouter un utilisateur</SheetTitle>
          <SheetDescription>Créer un nouvel utilisateur</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createForm.control} name="first_name" render={({ field }) => (<FormItem><FormLabel>Prénom *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={createForm.control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Nom *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={createForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={createForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Mot de passe *</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={createForm.control} name="password_confirmation" render={({ field }) => (<FormItem><FormLabel>Confirm Mot de passe *</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createForm.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Rôle *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{USER_ROLE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={createForm.control} name="agency_id" render={({ field }) => (
                  <FormItem><FormLabel>Agency</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sans agence" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">Sans agence</SelectItem>
                        {agencies.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : 'Create User'}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
