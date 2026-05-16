'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { Loader2, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

const consultantPasswordSchema = z.object({
  current_password: z.string().min(1, 'Le mot de passe actuel est requis'),
  new_password: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  confirm_password: z.string().min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
});

type ConsultantPasswordForm = z.infer<typeof consultantPasswordSchema>;

export default function ConsultantSecurityPage() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<ConsultantPasswordForm>({
    resolver: zodResolver(consultantPasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: ConsultantPasswordForm) => {
    setIsLoading(true);
    setError('');

    try {
      await apiClient.post(apiRoutes.consultant.security.updatePassword, {
        current_password: data.current_password,
        password: data.new_password,
        password_confirmation: data.confirm_password,
      });

      toast.success(t('security.password_changed_success'));
      form.reset();
      window.location.href = '/consultant/overview';
    } catch (error) {
      console.error('Erreur lors de la modification du mot de passe:', error);

      if (error instanceof Error && (error as any)?.response?.data?.errors) {
        const backendErrors = (error as any)?.response?.data?.errors;
        Object.keys(backendErrors).forEach((field) => {
          const formField = field === 'password' ? 'new_password' : field;
          if (form.getFieldState(formField as keyof ConsultantPasswordForm)) {
            form.setError(formField as keyof ConsultantPasswordForm, {
              type: 'server',
              message: backendErrors[field][0],
            });
          } else {
            setError((prev) => `${prev ? prev + ', ' : ''}${field}: ${backendErrors[field][0]}`);
          }
        });
      } else {
        setError(t('security.error_updating_password'));
      }

      toast.error(t('security.error_password_update'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="h-full w-full space-y-4 overflow-auto bg-gray-50 p-3">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{t('security.account_security')}</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-400 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t('security.password_change')}</CardTitle>
            <CardDescription>{t('security.password_change_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('security.current_password')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('security.new_password')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('security.confirm_password')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-3">
                  <Link href="/consultant/overview">
                    <Button variant="outline" type="button">
                      {t('common.cancel')}
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('security.updating')}
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        {t('security.update_password')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}