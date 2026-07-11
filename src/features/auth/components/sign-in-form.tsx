'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signInSchema, type SignInFormValues } from '../schemas/sign-in.schema';
import { paths } from '@/config/paths';

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: SignInFormValues) => {
    startTransition(async () => {
      try {
        const result = await signIn('credentials', {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (result?.error) {
          if (result.code === 'account-suspended') {
            toast.error('Votre compte a été suspendu. Veuillez contacter l\'administrateur.');
          } else {
            toast.error('Email ou mot de passe incorrect');
            form.setError('password', { message: 'Identifiants invalides' });
          }
        } else {
          toast.success('Connexion réussie !');
          window.location.href = paths.dashboard.root;
        }
      } catch {
        toast.error('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                Adresse email
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    disabled={isPending}
                    className={cn(
                      'pl-9 h-11 rounded-xl border-border/60',
                      'focus:border-primary focus:ring-1 focus:ring-primary/30',
                      'bg-background transition-all duration-200',
                    )}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Mot de passe
                </FormLabel>
                <Link
                  href={paths.auth.forgotPassword}
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    disabled={isPending}
                    className={cn(
                      'pl-9 pr-10 h-11 rounded-xl border-border/60',
                      'focus:border-primary focus:ring-1 focus:ring-primary/30',
                      'bg-background transition-all duration-200',
                    )}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={isPending}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full h-11 mt-2 rounded-xl font-semibold text-sm',
            'bg-primary hover:bg-primary/90 text-primary-foreground',
            'shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30',
            'transition-all duration-200',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion en cours…
            </>
          ) : (
            <>
              Se connecter
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
