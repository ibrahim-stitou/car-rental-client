'use client';

import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { useDashboardStatistics } from '@/features/overview/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconCar, IconCalendar, IconCurrencyDirham, IconUsers,
  IconAlertTriangle, IconShield, IconTool, IconCertificate,
  IconReceipt, IconTrendingUp, IconTrendingDown,
  IconCalendarPlus, IconUserPlus, IconFileInvoice, IconArrowRight,
} from '@tabler/icons-react';
import { paths } from '@/config/paths';
import { format, parseISO } from 'date-fns';
import PageContainer from '@/components/layout/page-container';

const fmt = (n: number) => n.toLocaleString('fr-MA');

function trend(current: number, prev: number) {
  if (prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  return { pct: Math.abs(pct).toFixed(1), up: pct >= 0 };
}

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

const STATUS_FR: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', active: 'Active',
  completed: 'Terminée', cancelled: 'Annulée',
};

const STATUS_CLS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

function KpiCard({ title, value, sub, icon: Icon, color, trend: t, onClick }: {
  title: string; value: string | number; sub?: string; icon: React.ElementType;
  color: string; trend?: { pct: string; up: boolean } | null; onClick?: () => void;
}) {
  return (
    <Card className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}><Icon className="h-4 w-4 text-white" /></div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1.5 mt-1">
          {t && (
            <span className={`flex items-center text-xs font-medium ${t.up ? 'text-green-600' : 'text-red-500'}`}>
              {t.up ? <IconTrendingUp className="h-3 w-3" /> : <IconTrendingDown className="h-3 w-3" />}
              {t.pct}%
            </span>
          )}
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Skel() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-9 rounded-lg" />
      </CardHeader>
      <CardContent><Skeleton className="h-7 w-20 mb-2" /><Skeleton className="h-3 w-36" /></CardContent>
    </Card>
  );
}

export function DashboardView() {
  const router = useRouter();
  const { data: res, isLoading } = useDashboardStatistics();
  const s = res?.data;

  const revTrend = s ? trend(s.billing.revenue_this_month, s.billing.revenue_last_month) : null;
  const toArr = (v: unknown): any[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v as object) : []);
  const chartData = toArr(s?.monthly_revenue).map((m: any) => ({ month: m.month, revenue: Number(m.revenue ?? 0) }));
  const vehiclePie = s ? [
    { name: 'Disponible', value: s.vehicles.available, color: PIE_COLORS[0] },
    { name: 'Loué', value: s.vehicles.rented, color: PIE_COLORS[1] },
    { name: 'Maintenance', value: s.vehicles.maintenance, color: PIE_COLORS[2] },
    { name: 'Hors service', value: s.vehicles.out_of_service, color: PIE_COLORS[3] },
  ].filter((e) => e.value > 0) : [];

  const availRate = s && s.vehicles.total > 0 ? Math.round((s.vehicles.available / s.vehicles.total) * 100) : 0;
  const totalExpiring = s ? s.expiring.insurances + s.expiring.inspections + s.expiring.vignettes + s.expiring.maintenances : 0;

  return (
    <PageContainer scrollable={true}>
    <div className="flex flex-col gap-6 p-6 w-full">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Vue d'ensemble de la flotte · {new Date().toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Actualiser</Button>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Nouvelle réservation', icon: IconCalendarPlus, color: 'bg-violet-500 hover:bg-violet-600', path: paths.reservations.list },
          { label: 'Ajouter un véhicule', icon: IconCar, color: 'bg-blue-500 hover:bg-blue-600', path: paths.vehicles.list },
          { label: 'Ajouter un client', icon: IconUserPlus, color: 'bg-orange-500 hover:bg-orange-600', path: paths.clients.list },
          { label: 'Nouvelle facture', icon: IconFileInvoice, color: 'bg-emerald-500 hover:bg-emerald-600', path: paths.billing.list },
        ].map(({ label, icon: Icon, color, path }) => (
          <Button key={label} className={`${color} text-white gap-2 h-10 justify-start`} onClick={() => router.push(path)}>
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{label}</span>
          </Button>
        ))}
      </div>

      {/* KPI principaux */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skel key={i} />) : (
          <>
            <KpiCard title="Véhicules totaux" value={s?.vehicles.total ?? 0} sub={`${s?.vehicles.available ?? 0} disponibles · ${availRate}% de disponibilité`} icon={IconCar} color="bg-blue-500" onClick={() => router.push(paths.vehicles.list)} />
            <KpiCard title="Revenu ce mois" value={`${fmt(s?.billing.revenue_this_month ?? 0)} MAD`} sub={`vs ${fmt(s?.billing.revenue_last_month ?? 0)} MAD le mois dernier`} icon={IconCurrencyDirham} color="bg-emerald-500" trend={revTrend} onClick={() => router.push(paths.billing.list)} />
            <KpiCard title="Réservations actives" value={s?.reservations.active ?? 0} sub={`${s?.reservations.overdue ?? 0} en retard · ${s?.reservations.upcoming_returns ?? 0} retours dans 7j`} icon={IconCalendar} color="bg-violet-500" onClick={() => router.push(paths.reservations.list)} />
            <KpiCard title="Clients totaux" value={s?.clients.total ?? 0} sub={`${s?.clients.new_this_month ?? 0} nouveau(x) ce mois · ${s?.clients.blacklisted ?? 0} blacklisté(s)`} icon={IconUsers} color="bg-orange-500" onClick={() => router.push(paths.clients.list)} />
          </>
        )}
      </div>

      {/* KPI secondaires */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skel key={i} />) : (
          <>
            <KpiCard title="En attente d'action" value={s?.reservations.pending_action ?? 0} sub={`${s?.reservations.pending ?? 0} en attente · ${s?.reservations.confirmed ?? 0} confirmées`} icon={IconCalendar} color="bg-amber-500" onClick={() => router.push(paths.reservations.list)} />
            <KpiCard title="Créances clients" value={`${fmt(s?.billing.pending_amount ?? 0)} MAD`} sub={`${s?.billing.draft_count ?? 0} brouillons · ${s?.billing.paid_count ?? 0} factures réglées`} icon={IconCurrencyDirham} color="bg-rose-500" onClick={() => router.push(paths.billing.list)} />
            <KpiCard title="Véhicules loués" value={s?.vehicles.rented ?? 0} sub={`${s?.vehicles.maintenance ?? 0} en maintenance · ${s?.vehicles.out_of_service ?? 0} hors service`} icon={IconCar} color="bg-sky-500" onClick={() => router.push(paths.vehicles.list)} />
            <KpiCard title="Documents expirants" value={totalExpiring} sub={`Assurances ${s?.expiring.insurances ?? 0} · Visites ${s?.expiring.inspections ?? 0}`} icon={totalExpiring > 0 ? IconAlertTriangle : IconShield} color={totalExpiring > 0 ? 'bg-red-500' : 'bg-slate-400'} />
          </>
        )}
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenu — 12 derniers mois</CardTitle>
            <CardDescription>Factures payées (FA) en MAD</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`${fmt(v)} MAD`, 'Revenu']} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>État de la flotte</CardTitle>
            <CardDescription>{s?.vehicles.total ?? 0} véhicules au total</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64 w-full" /> : vehiclePie.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={vehiclePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                      {vehiclePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, 'Véhicules']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {vehiclePie.map((e) => (
                    <div key={e.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <span className="text-xs text-muted-foreground truncate">{e.name}</span>
                      <span className="text-xs font-medium ml-auto">{e.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Aucun véhicule</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Répartition réservations + Documents expirants */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Répartition des réservations</CardTitle>
            <CardDescription>{s?.reservations.total ?? 0} au total · {s?.reservations.this_month ?? 0} créées ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                  {[
                    { key: 'pending', label: 'En attente', value: s?.reservations.pending ?? 0, color: 'text-amber-600' },
                    { key: 'confirmed', label: 'Confirmées', value: s?.reservations.confirmed ?? 0, color: 'text-blue-600' },
                    { key: 'active', label: 'Actives', value: s?.reservations.active ?? 0, color: 'text-green-600' },
                    { key: 'completed', label: 'Terminées', value: s?.reservations.completed ?? 0, color: 'text-slate-600' },
                    { key: 'cancelled', label: 'Annulées', value: s?.reservations.cancelled ?? 0, color: 'text-red-600' },
                    { key: 'overdue', label: 'En retard', value: s?.reservations.overdue ?? 0, color: 'text-rose-700 font-bold' },
                  ].map(({ key, label, value, color }) => (
                    <div key={key} className="text-center p-3 rounded-lg bg-muted/50">
                      <div className={`text-2xl font-bold ${color}`}>{value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={[{ name: '', pending: s?.reservations.pending ?? 0, confirmed: s?.reservations.confirmed ?? 0, active: s?.reservations.active ?? 0, completed: s?.reservations.completed ?? 0, cancelled: s?.reservations.cancelled ?? 0 }]} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip />
                    <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="En attente" />
                    <Bar dataKey="confirmed" stackId="a" fill="#3b82f6" name="Confirmées" />
                    <Bar dataKey="active" stackId="a" fill="#22c55e" name="Actives" />
                    <Bar dataKey="completed" stackId="a" fill="#94a3b8" name="Terminées" />
                    <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="Annulées" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-4 w-4 text-amber-500" />
              Expirent dans 30 jours
            </CardTitle>
            <CardDescription>Documents à renouveler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />) : (
              <>
                {[
                  { label: 'Assurances', value: s?.expiring.insurances ?? 0, icon: IconShield, color: 'text-blue-500', path: paths.insurances.list },
                  { label: 'Visites techniques', value: s?.expiring.inspections ?? 0, icon: IconCertificate, color: 'text-purple-500', path: paths.technicalInspections.list },
                  { label: 'Vignettes', value: s?.expiring.vignettes ?? 0, icon: IconReceipt, color: 'text-green-500', path: paths.vignettes.list },
                  { label: 'Maintenances', value: s?.expiring.maintenances ?? 0, icon: IconTool, color: 'text-orange-500', path: paths.maintenances.list },
                ].map(({ label, value, icon: Icon, color, path }) => (
                  <button key={label} onClick={() => router.push(path)} className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <Badge variant={value > 0 ? 'destructive' : 'secondary'} className="text-xs">{value}</Badge>
                  </button>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dernières réservations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dernières réservations</CardTitle>
            <CardDescription>Les 8 dernières réservations enregistrées</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push(paths.reservations.list)}>
            Voir tout <IconArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-40 w-full" /> : (
            <div className="space-y-0">
              {toArr(s?.recent_reservations).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Aucune réservation pour le moment</p>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                    <div className="col-span-2">Référence</div>
                    <div className="col-span-3">Véhicule</div>
                    <div className="col-span-2">Client</div>
                    <div className="col-span-2">Départ</div>
                    <div className="col-span-1">Statut</div>
                    <div className="col-span-2 text-right">Montant</div>
                  </div>
                  {toArr(s?.recent_reservations).map((r: any) => (
                    <div key={r.id} className="grid grid-cols-12 gap-2 px-3 py-2.5 text-sm border-b last:border-0 hover:bg-muted/40 cursor-pointer transition-colors rounded" onClick={() => router.push(paths.reservations.list)}>
                      <div className="col-span-2 font-mono text-xs font-medium truncate">{r.reservation_number}</div>
                      <div className="col-span-3 text-sm truncate">{r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : '—'}</div>
                      <div className="col-span-2 text-sm truncate">{r.client ? `${r.client.first_name} ${r.client.last_name}` : '—'}</div>
                      <div className="col-span-2 text-xs text-muted-foreground">{r.pickup_date ? format(parseISO(r.pickup_date), 'dd/MM/yy') : '—'}</div>
                      <div className="col-span-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_CLS[r.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {STATUS_FR[r.status] ?? r.status}
                        </span>
                      </div>
                      <div className="col-span-2 text-right font-medium">{fmt(Number(r.total_amount))} MAD</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PageContainer>
  );
}

