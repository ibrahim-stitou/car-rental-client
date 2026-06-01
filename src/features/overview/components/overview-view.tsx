'use client';

import { useDashboardStatistics } from '@/features/overview/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  IconCar, IconCalendar, IconCurrencyDirham, IconUsers,
  IconAlertTriangle, IconShield, IconTool, IconCertificate, IconReceipt,
} from '@tabler/icons-react';

function KpiCard({ title, value, sub, icon: Icon, iconColor }: {
  title: string; value: string | number; sub?: string; icon: React.ElementType; iconColor: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function OverviewView() {
  const { data: res, isLoading } = useDashboardStatistics();
  const stats = res?.data;

  const chartData = stats?.monthly_revenue?.map((m) => ({
    month: m.month,
    revenue: Number(m.revenue),
  })) ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Fleet & operations overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title="Total Vehicles"
              value={stats?.vehicles.total ?? 0}
              sub={`${stats?.vehicles.available ?? 0} available · ${stats?.vehicles.rented ?? 0} rented`}
              icon={IconCar}
              iconColor="bg-blue-500"
            />
            <KpiCard
              title="Active Reservations"
              value={stats?.reservations.active ?? 0}
              sub={stats?.reservations.overdue ? `${stats.reservations.overdue} overdue` : `${stats?.reservations.pending ?? 0} pending`}
              icon={IconCalendar}
              iconColor="bg-violet-500"
            />
            <KpiCard
              title="Monthly Revenue"
              value={`${(stats?.billing.total_revenue ?? 0).toLocaleString('fr-MA')} MAD`}
              sub={`${stats?.billing.paid_count ?? 0} invoices paid`}
              icon={IconCurrencyDirham}
              iconColor="bg-emerald-500"
            />
            <KpiCard
              title="Total Clients"
              value={stats?.clients.total ?? 0}
              sub={`${stats?.clients.active ?? 0} active`}
              icon={IconUsers}
              iconColor="bg-orange-500"
            />
          </>
        )}
      </div>

      {/* Revenue Chart + Expiry Alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue (12 months)</CardTitle>
            <CardDescription>Monthly invoiced revenue in MAD</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} MAD`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-4 w-4 text-amber-500" />
              Expiring Soon
            </CardTitle>
            <CardDescription>Documents expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : (
              <>
                {[
                  { label: 'Insurances', value: stats?.expiring.insurances ?? 0, icon: IconShield, color: 'text-blue-500' },
                  { label: 'Inspections', value: stats?.expiring.inspections ?? 0, icon: IconCertificate, color: 'text-purple-500' },
                  { label: 'Vignettes', value: stats?.expiring.vignettes ?? 0, icon: IconReceipt, color: 'text-green-500' },
                  { label: 'Maintenances', value: stats?.expiring.maintenances ?? 0, icon: IconTool, color: 'text-orange-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <Badge variant={value > 0 ? 'destructive' : 'secondary'}>{value}</Badge>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reservation breakdown */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          [
            { label: 'Pending', value: stats?.reservations.pending ?? 0, color: 'text-amber-600' },
            { label: 'Confirmed', value: stats?.reservations.confirmed ?? 0, color: 'text-blue-600' },
            { label: 'Active', value: stats?.reservations.active ?? 0, color: 'text-green-600' },
            { label: 'Completed', value: stats?.reservations.completed ?? 0, color: 'text-slate-600' },
            { label: 'Cancelled', value: stats?.reservations.cancelled ?? 0, color: 'text-red-600' },
            { label: 'Overdue', value: stats?.reservations.overdue ?? 0, color: 'text-rose-700' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="text-center">
              <CardContent className="pt-4 pb-3">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
