'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import PageContainer from '@/components/layout/page-container';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { IconTrendingUp, IconCurrencyDirham, IconCar, IconCalendar } from '@tabler/icons-react';
import { useExpenseStatistics } from '@/features/expenses/hooks/use-expenses';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`p-1.5 rounded-lg ${color}`}><Icon className="h-4 w-4 text-white" /></div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function fmt(n: number | undefined) { return (n ?? 0).toLocaleString('fr-MA'); }

export function ReportsView() {
  const { data: dashRes, isLoading: loadingDash } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => apiClient.get(apiRoutes.dashboard.statistics).then((r) => r.data),
  });
  const { data: billingStatsRes } = useQuery({
    queryKey: ['reports', 'billing'],
    queryFn: () => apiClient.get(apiRoutes.billing.statistics).then((r) => r.data),
  });
  const { data: reservStatsRes } = useQuery({
    queryKey: ['reports', 'reservations'],
    queryFn: () => apiClient.get(apiRoutes.reservations.statistics).then((r) => r.data),
  });
  const { data: expStatsRes } = useExpenseStatistics();

  const dash = dashRes?.data;
  const billingStats = billingStatsRes?.data;
  const reservStats = reservStatsRes?.data;
  const expStats = expStatsRes?.data;

  // Defensive array coercion — API might return Collection as object in some cases
  const toArr = (v: unknown): any[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v as object) : []);

  const monthlyRevenue = toArr(dash?.monthly_revenue).map((m: any) => ({
    month: typeof m.month === 'string' ? m.month.slice(5) : String(m.month ?? ''),
    revenue: Number(m.revenue ?? 0),
  }));

  const reservStatusData = dash ? [
    { name: 'En attente', value: Number(dash.reservations?.pending ?? 0) },
    { name: 'Confirmées', value: Number(dash.reservations?.confirmed ?? 0) },
    { name: 'Actives', value: Number(dash.reservations?.active ?? 0) },
    { name: 'Terminées', value: Number(dash.reservations?.completed ?? 0) },
    { name: 'Annulées', value: Number(dash.reservations?.cancelled ?? 0) },
  ].filter((d) => d.value > 0) : [];

  const expCategoryData = expStats?.byCategory && typeof expStats.byCategory === 'object'
    ? Object.entries(expStats.byCategory as Record<string, unknown>)
        .map(([cat, total]) => ({ name: cat, value: Number(total) }))
        .sort((a, b) => b.value - a.value)
    : [];

  const vehicleStatusData = dash ? [
    { name: 'Disponibles', value: Number(dash.vehicles?.available ?? 0) },
    { name: 'Loués', value: Number(dash.vehicles?.rented ?? 0) },
    { name: 'Maintenance', value: Number(dash.vehicles?.maintenance ?? 0) },
    { name: 'Hors service', value: Number(dash.vehicles?.out_of_service ?? 0) },
  ].filter((d) => d.value > 0) : [];

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue consolidée des performances financières et opérationnelles</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingDash ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
            <>
              <KpiCard label="Revenu total" value={`${fmt(dash?.billing?.total_revenue)} MAD`} sub={`${fmt(dash?.billing?.revenue_this_month)} ce mois`} icon={IconCurrencyDirham} color="bg-emerald-500" />
              <KpiCard label="Total dépenses" value={`${fmt(expStats?.total)} MAD`} sub={`${fmt(expStats?.thisMonth)} ce mois`} icon={IconCurrencyDirham} color="bg-red-500" />
              <KpiCard label="Réservations totales" value={reservStats?.total ?? 0} sub={`${reservStats?.completed ?? 0} terminées`} icon={IconCalendar} color="bg-violet-500" />
              <KpiCard label="Flotte" value={`${dash?.vehicles?.available ?? 0}/${dash?.vehicles?.total ?? 0}`} sub="véhicules disponibles" icon={IconCar} color="bg-blue-500" />
            </>
          )}
        </div>

        <Tabs defaultValue="revenue">
          <TabsList>
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="reservations">Réservations</TabsTrigger>
            <TabsTrigger value="expenses">Dépenses</TabsTrigger>
            <TabsTrigger value="fleet">Flotte</TabsTrigger>
          </TabsList>

          {/* Revenue tab */}
          <TabsContent value="revenue" className="space-y-4 mt-4">
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenu mensuel (12 derniers mois)</CardTitle>
                  <CardDescription>Factures payées en MAD</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingDash ? <Skeleton className="h-64 w-full" /> : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${v.toLocaleString('fr-MA')} MAD`]} />
                        <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Facturation</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    ['Total documents', billingStats?.total_documents ?? dash?.billing?.total_invoices ?? '—'],
                    ['Montant total', `${fmt(Number(billingStats?.total_amount ?? 0))} MAD`],
                    ['Déjà payé', `${fmt(Number(billingStats?.paid_amount ?? 0))} MAD`],
                    ['Solde restant', `${fmt(Number(billingStats?.balance ?? 0))} MAD`],
                    ['Revenu (dashboard)', `${fmt(dash?.billing?.total_revenue)} MAD`],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold">{v as string}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reservations tab */}
          <TabsContent value="reservations" className="space-y-4 mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Répartition par statut</CardTitle></CardHeader>
                <CardContent>
                  {reservStatusData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={reservStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                          {reservStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Statistiques</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    ['Total réservations', reservStats?.total ?? '—'],
                    ['Terminées', reservStats?.completed ?? '—'],
                    ['Actives', reservStats?.active ?? '—'],
                    ['Annulées', reservStats?.cancelled ?? '—'],
                    ['En retard (actives)', dash?.reservations?.overdue ?? 0],
                    ['Revenu généré', `${fmt(reservStats?.total_revenue)} MAD`],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold">{v as string}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Expenses tab */}
          <TabsContent value="expenses" className="space-y-4 mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Dépenses par catégorie</CardTitle></CardHeader>
                <CardContent>
                  {expCategoryData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Aucune dépense enregistrée</p> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={expCategoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip formatter={(v: number) => [`${v.toLocaleString('fr-MA')} MAD`]} />
                        <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Résumé des dépenses</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    ['Total dépenses', `${fmt(expStats?.total)} MAD`],
                    ['Ce mois', `${fmt(expStats?.thisMonth)} MAD`],
                    ['Mois précédent', `${fmt(expStats?.lastMonth)} MAD`],
                    ['Marge brute', `${fmt((dash?.billing?.total_revenue ?? 0) - (expStats?.total ?? 0))} MAD`],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold">{v as string}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fleet tab */}
          <TabsContent value="fleet" className="space-y-4 mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>État de la flotte</CardTitle></CardHeader>
                <CardContent>
                  {vehicleStatusData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Aucun véhicule</p> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={vehicleStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                          {vehicleStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Chiffres clés flotte</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    ['Total véhicules', dash?.vehicles?.total ?? '—'],
                    ['Disponibles', dash?.vehicles?.available ?? '—'],
                    ['En location', dash?.vehicles?.rented ?? '—'],
                    ['En maintenance', dash?.vehicles?.maintenance ?? '—'],
                    ['Hors service', dash?.vehicles?.out_of_service ?? '—'],
                    ['Taux occupation', dash?.vehicles?.total ? `${Math.round(((dash.vehicles.rented ?? 0) / dash.vehicles.total) * 100)}%` : '—'],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold">{v as string}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
