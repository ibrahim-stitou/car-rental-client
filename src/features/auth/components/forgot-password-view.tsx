'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { z } from 'zod';
import { Mail, ArrowLeft, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { paths } from '@/config/paths';
import { IconCar } from '@tabler/icons-react';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';

const schema = z.object({
  email: z.string().email({ message: 'Veuillez saisir une adresse email valide' }),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordView() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await apiClient.post(apiRoutes.auth.forgotPassword, { email: values.email });
        setSentEmail(values.email);
        setSent(true);
        toast.success('Lien de réinitialisation envoyé');
      } catch {
        toast.error('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Left panel */}
      <div className="relative hidden lg:flex lg:w-[55%] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 right-0 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/40">
            <IconCar className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-tight">GES-CARS</div>
            <div className="text-xs text-slate-400 -mt-0.5">Plateforme de gestion 2026</div>
          </div>
        </div>

        <div className="relative space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Mot de passe oublié ?<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Pas de problème.
            </span>
          </h1>
          <p className="text-slate-400 text-base max-w-sm leading-relaxed">
            Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe en toute sécurité.
          </p>
        </div>

        <p className="text-center text-xs text-slate-500">© 2026 GES-CARS · Tous droits réservés</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <IconCar className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm">GES-CARS</span>
          </div>
          <div className="hidden lg:block" />
          <ModeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-16">
          <div className="w-full max-w-sm">
            {!sent ? (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Réinitialisation</h2>
                  <p className="text-sm text-muted-foreground mt-1.5">Entrez votre email pour recevoir un lien de réinitialisation</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="email" render={({ field }) => (
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
                      )} />

                      <Button type="submit" disabled={isPending} className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all">
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi en cours…</> : <><Send className="mr-2 h-4 w-4" />Envoyer le lien</>}
                      </Button>
                    </form>
                  </Form>
                </div>

                <div className="mt-6 text-center">
                  <Link href={paths.auth.signIn} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la connexion
                  </Link>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Email envoyé !</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Nous avons envoyé un lien de réinitialisation à <strong className="text-foreground">{sentEmail}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Vérifiez votre dossier spam si vous ne le recevez pas.</p>
                </div>
                <Button variant="outline" className="w-full rounded-xl" asChild>
                  <Link href={paths.auth.signIn}><ArrowLeft className="mr-2 h-4 w-4" />Retour à la connexion</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden lg:hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
    </div>
  );
}
