'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2, Receipt, Bell, CalendarDays, Globe, Hash, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingCard {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  active: boolean;
  iconColor: string;
  iconBg: string;
}

const cards: SettingCard[] = [
  {
    href: '/settings/company',
    icon: Building2,
    title: "Paramètres d'Entreprise",
    description: 'Informations générales, identifiants fiscaux, bancaires et forme juridique',
    active: true,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
  {
    href: '#',
    icon: Receipt,
    title: 'Facturation',
    description: 'Devise, taux TVA, préfixes de factures et conditions de paiement',
    active: false,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
  },
  {
    href: '#',
    icon: Bell,
    title: 'Alertes & Notifications',
    description: "Seuils d'alerte assurance, visite technique, maintenance et retards",
    active: false,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
  },
  {
    href: '#',
    icon: CalendarDays,
    title: 'Réservations',
    description: 'Acompte par défaut, frais de retard, durées min/max de location',
    active: false,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-100',
  },
  {
    href: '/settings/counters',
    icon: Hash,
    title: 'Gestion des Compteurs',
    description: 'Préfixes et format des numéros de documents (FA, DV, BC, BL, BR, AV, Réservations)',
    active: true,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
  },
  {
    href: '#',
    icon: Globe,
    title: 'Site Web',
    description: 'Contenu du site public, réseaux sociaux, SEO et couleurs',
    active: false,
    iconColor: 'text-pink-600',
    iconBg: 'bg-pink-100',
  },
];

export function SettingsLanding() {
  return (
    <div className="p-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">Configurez les différents aspects de votre application</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const content = (
            <Card className={cn(
              'transition-all duration-200',
              card.active
                ? 'hover:shadow-md hover:border-primary/30 cursor-pointer'
                : 'opacity-60 cursor-not-allowed'
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn('p-2.5 rounded-lg', card.iconBg)}>
                    <Icon className={cn('h-5 w-5', card.iconColor)} />
                  </div>
                  {card.active
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    : <Badge variant="secondary" className="text-xs">Bientôt</Badge>
                  }
                </div>
                <CardTitle className="text-base mt-2">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed">{card.description}</CardDescription>
              </CardContent>
            </Card>
          );

          return card.active ? (
            <Link key={card.title} href={card.href}>{content}</Link>
          ) : (
            <div key={card.title}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
