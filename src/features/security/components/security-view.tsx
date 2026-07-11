'use client';

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
import { applyServerErrors } from '@/lib/form-errors';

const schema = z.object({
  current_password: z.string().min(1, 'Le mot de passe actuel est requis'),
  new_password: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  new_password_confirmation: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
}).refine((d) => d.new_password === d.new_password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['new_password_confirmation'],
});

type FormValues = z.infer<typeof schema>;

export function SecurityView() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', new_password: '', new_password_confirmation: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await apiClient.post(apiRoutes.auth.changePassword, values);
      toast.success('Mot de passe modifié avec succès');
      form.reset();
    } catch (err: any) {
      applyServerErrors(err, form, 'Échec du changement de mot de passe');
    }
  };

  return (
    <div className="p-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sécurité</h1>
        <p className="text-muted-foreground text-sm mt-1">Modifiez votre mot de passe</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
          <CardDescription>Saisissez votre mot de passe actuel puis choisissez-en un nouveau.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
              <FormField control={form.control} name="current_password" render={({ field }) => (
                <FormItem><FormLabel>Mot de passe actuel *</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="new_password" render={({ field }) => (
                <FormItem><FormLabel>Nouveau mot de passe *</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="new_password_confirmation" render={({ field }) => (
                <FormItem><FormLabel>Confirm Nouveau mot de passe *</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Enregistrement…' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
