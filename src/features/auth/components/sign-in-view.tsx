'use client';

import SignInForm from './sign-in-form';
import { IconCar, IconCalendar, IconShield, IconTrendingUp, IconMapPin, IconStar } from '@tabler/icons-react';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';


const FEATURES = [
  { icon: IconCalendar, text: 'Réservations en temps réel' },
  { icon: IconShield, text: 'Gestion des assurances & visites' },
  { icon: IconTrendingUp, text: 'Tableaux de bord & analytics' },
  { icon: IconMapPin, text: 'Multi-agences & multi-sites' },
];

export default function SignInViewPage() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">

      {/* ─── Left panel ─── */}
      <div className="relative hidden lg:flex lg:w-[55%] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12">

        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Glow blobs */}
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 right-0 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Top logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/40">
            <IconCar className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-tight">GES-CARS</div>
            <div className="text-xs text-slate-400 -mt-0.5">Plateforme de gestion 2026</div>
          </div>
        </div>

        {/* Middle content */}
        <div className="relative space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-4">
              <IconStar className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">Solution complète de gestion</span>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Gérez votre flotte<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                simplement & efficacement
              </span>
            </h1>
            <p className="mt-3 text-slate-400 text-base leading-relaxed max-w-sm">
              Une plateforme tout-en-un pour la gestion de flotte, réservations, clients, facturation et bien plus encore.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative">
          <p className="mt-4 text-center text-xs text-slate-500">
            © 2026 GES-CARS · Tous droits réservés
          </p>
        </div>
      </div>

      {/* ─── Right panel ─── */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 lg:px-10">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <IconCar className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm">GES-CARS</span>
          </div>
          <div className="hidden lg:block" />
          <ModeToggle />
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-16">
          <div className="w-full max-w-sm">

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Bon retour ! 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Connectez-vous à votre espace de gestion
              </p>
            </div>

            {/* Form card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <SignInForm />
            </div>

            {/* Footer note */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Accès réservé au personnel autorisé.{' '}
              <span className="text-muted-foreground/60">Contactez votre administrateur pour toute assistance.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative blobs (right panel, mobile) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden lg:hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
    </div>
  );
}
