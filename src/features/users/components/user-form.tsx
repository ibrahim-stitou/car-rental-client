'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from '@/stores/user-store';
import { userSchema } from '@/validations/user-schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UserFormProps {
  initialData?: User | null;
  pageTitle: string;
}

export function UserForm({ initialData, pageTitle }: UserFormProps) {
  const router = useRouter();
  const form = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData || {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      role_id: 2,
    },
  });

  const onSubmit = async (data: User) => {
    try {
      if (initialData) {
        await apiClient.put(`/admin/users/${initialData.id}`, data);
        toast.success('Utilisateur mis à jour avec succès');
      } else {
        await apiClient.post('/admin/users', data);
        toast.success('Utilisateur créé avec succès');
      }
      router.push('/admin/users');
      router.refresh();
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
    ;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{pageTitle}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Prénom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="Téléphone" type="tel" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString()}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Administrateur</SelectItem>
                      <SelectItem value="2">Consultant</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/users')}
            >
              Annuler
            </Button>
            <Button type="submit">
              {initialData ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}