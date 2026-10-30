'use client';

import Link from 'next/link';
import { AlarmClock, ArrowRight, Car, Clock, Inbox, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/hooks/useAuth';
import { useWebRequests, useWebRequestStats } from '../hooks/use-website';
import { REQUEST_STATUS } from '../constants';
import { formatDateTime } from '../utils';
import { WebRequestStatusBadge } from './web-requests-view';

function minutesLabel(minutes: number) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function WebsiteDashboardView() {
  const { hasPermission } = useAuth();
  const canSeeRequests = hasPermission('view-website-requests');
  const { data: statsRes, isLoading } = useWebRequestStats({ refetchInterval: 60_000, enabled: canSeeRequests });
  const stats = statsRes?.data;
  const { data: openRes } = useWebRequests({ open: true, per_page: 8 }, canSeeRequests);
  const open = canSeeRequests ? openRes?.data ?? [] : [];

  const links = [
    { href: '/website/vehicles', label: 'Véhicules du site', permission: 'manage-website-catalog' },
    { href: '/website/agencies', label: 'Agences du site', permission: 'manage-website-catalog' },
    { href: '/website/extras', label: 'Options de location', permission: 'manage-website-content' },
    { href: '/website/conditions', label: 'Conditions de location', permission: 'manage-website-content' },
    { href: '/website/content', label: 'Contenu du site', permission: 'manage-website-content' },
  ].filter((l) => hasPermission(l.permission));

  const kpis = stats ? [
    { label: 'À traiter', value: stats.open, icon: Inbox, color: 'bg-blue-500' },
    { label: 'En retard (> 2 h)', value: stats.late_first_contact, icon: AlarmClock, color: stats.late_first_contact > 0 ? 'bg-red-500' : 'bg-slate-400' },
    { label: 'Délai moyen de 1er contact', value: minutesLabel(stats.avg_first_contact_minutes), icon: Clock, color: 'bg-amber-500' },
    { label: 'Taux de conversion', value: `${stats.conversion_rate} %`, icon: Percent, color: 'bg-green-600' },
    { label: "Reçues aujourd'hui", value: stats.today, icon: Inbox, color: 'bg-indigo-500' },
    { label: 'Véhicules en ligne', value: stats.vehicles_on_site, icon: Car, color: 'bg-slate-600' },
  ] : [];

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Site web" description="Suivi des demandes du site public et gestion du catalogue en ligne" />

      {canSeeRequests && (
        isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {kpis.map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                  <div className={`p-1.5 rounded-lg ${color}`}><Icon className="h-4 w-4 text-white" /></div>
                </CardHeader>
                <CardContent><div className="text-xl font-bold">{value}</div></CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        {canSeeRequests && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Demandes à traiter</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/website/requests">Toutes les demandes<ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
            </CardHeader>
            <CardContent>
              {open.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune demande en attente.</p>
              ) : (
                <ul className="divide-y">
                  {open.map((r) => (
                    <li key={r.id}>
                      <Link href={`/website/requests/${r.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-muted/40 -mx-2 px-2 rounded">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.full_name} <span className="font-mono text-xs text-muted-foreground">{r.reference}</span></p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.vehicle?.full_name ?? '—'} · {formatDateTime(r.pickup_date, 'dd MMM')} → {formatDateTime(r.return_date, 'dd MMM')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <WebRequestStatusBadge request={r} />
                          <span className="text-[11px] text-muted-foreground">reçue {formatDateTime(r.created_at, 'dd/MM HH:mm')}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {stats && (
            <Card>
              <CardHeader><CardTitle className="text-base">Répartition des demandes</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {Object.entries(stats.by_status).filter(([, n]) => n > 0).map(([status, n]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{REQUEST_STATUS[status as keyof typeof REQUEST_STATUS]?.label ?? status}</span>
                    <span className="font-semibold">{n}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm border-t pt-1.5"><span>Total</span><span className="font-semibold">{stats.total}</span></div>
              </CardContent>
            </Card>
          )}

          {links.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Gérer le site</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-1">
                {links.map((l) => (
                  <Button key={l.href} variant="ghost" className="justify-between" asChild>
                    <Link href={l.href}>{l.label}<ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
