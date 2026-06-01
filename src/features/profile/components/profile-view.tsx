'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProfileView() {
  const { data: session, update } = useSession();
  const user = session?.user as any;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', phone: '' },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.firstName ?? '',
        last_name: user.lastName ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  const onSubmit = async (values: FormValues) => {
    try {
      await apiClient.put(apiRoutes.users.updateProfile, values);
      toast.success('Profil mis à jour');
      await update();
    } catch {
      toast.error('Échec de la mise à jour profile');
    }
  };

  if (!user) return null;

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos informations personnelles</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{user.firstName} {user.lastName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <div className="flex flex-wrap gap-1 mt-1">
                {(user.roles as string[] ?? []).map((r: string) => (
                  <Badge key={r} variant="outline" className="text-xs capitalize">{r.replace(/-/g, ' ')}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem><FormLabel>Prénom *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem><FormLabel>Nom *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input value={user.email} disabled className="bg-muted" />
              </FormItem>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="+212 6XX XXX XXX" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
