'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateUser, useUpdateUser } from '../hooks/use-users';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import { useRoles } from '@/features/roles/hooks/use-roles';
import type { User } from '@/types/user.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { applyServerErrors } from '@/lib/form-errors';

const createSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(8),
  phone: z.string().optional(),
  agency_ids: z.array(z.string()).optional(),
  role: z.string().min(1, 'Role is required'),
}).refine((d) => d.password === d.password_confirmation, { message: 'Passwords do not match', path: ['password_confirmation'] });

const editSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  agency_ids: z.array(z.string()).optional(),
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
  const { data: rolesRes } = useRoles();
  const roles = rolesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', password_confirmation: '', phone: '', agency_ids: [], role: '' },
  });
  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: { first_name: '', last_name: '', email: '', phone: '', agency_ids: [] },
  });

  useEffect(() => {
    if (user) {
      editForm.reset({ first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone ?? '', agency_ids: user.agencies?.map((a) => a.id) ?? [] });
    } else {
      createForm.reset({ first_name: '', last_name: '', email: '', password: '', password_confirmation: '', phone: '', agency_ids: [], role: '' });
    }
  }, [user, open]);

  const onSubmitCreate = (values: z.infer<typeof createSchema>) => {
    createMutation.mutate(values as any, {
      onSuccess: () => { toast.success('Utilisateur créé'); onOpenChange(false); createForm.reset(); onSuccess?.(); },
      onError: (error) => applyServerErrors(error, createForm, "Impossible de créer l'utilisateur"),
    });
  };

  const onSubmitEdit = (values: z.infer<typeof editSchema>) => {
    updateMutation.mutate(values, {
      onSuccess: () => { toast.success('Utilisateur mis à jour'); onOpenChange(false); onSuccess?.(); },
      onError: (error) => applyServerErrors(error, editForm, "Échec de la mise à jour de l'utilisateur"),
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
                <FormField control={editForm.control} name="agency_ids" render={({ field }) => (
                  <FormItem><FormLabel>Agences</FormLabel>
                    <MultiSelect
                      options={agencies.map((a) => ({ value: a.id, label: a.name }))}
                      selected={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Aucune agence"
                      className="w-full"
                    />
                    <FormMessage /></FormItem>
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
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger></FormControl>
                      <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={createForm.control} name="agency_ids" render={({ field }) => (
                <FormItem><FormLabel>Agences</FormLabel>
                  <MultiSelect
                    options={agencies.map((a) => ({ value: a.id, label: a.name }))}
                    selected={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Aucune agence"
                    className="w-full"
                  />
                  <FormMessage /></FormItem>
              )} />
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
