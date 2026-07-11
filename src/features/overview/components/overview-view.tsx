'use client';

import { useState } from 'react';
import { useDashboardStatistics, useOverdueReservations, useCreditReservations } from '@/features/overview/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaymentDialog } from '@/features/reservations/components/payment-dialog';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  IconCar, IconCalendar, IconCurrencyDirham, IconUsers,
  IconAlertTriangle, IconShield, IconTool, IconCertificate, IconReceipt,
  IconClock, IconCreditCard,
} from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

function KpiCard({ title, value, sub, icon: Icon, iconColor, onClick }: {
  title: string; value: string | number; sub?: string; icon: React.ElementType;
  iconColor: string; onClick?: () => void;
}) {
  return (
    <Card className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={onClick}>
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

function fdate(d: string | undefined) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

function OverdueModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: res } = useOverdueReservations();
  const reservations = (res as any)?.data?.data ?? [];
  const [paymentDialog, setPaymentDialog] = useState<{ id: string; ref: string } | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <IconClock className="h-5 w-5" /> Réservations en retard
            </DialogTitle>
          </DialogHeader>
          {reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune réservation en retard</p>
          ) : (
            <div className="space-y-2">
              {reservations.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 border border-orange-100 bg-orange-50 rounded-lg text-sm">
                  <div>
                    <div className="font-mono font-medium">{r.reservation_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.client?.full_name ?? `${r.client?.first_name} ${r.client?.last_name}`} · {r.vehicle?.brand} {r.vehicle?.model}
                    </div>
                    <div className="text-xs text-orange-700 font-medium">Retour prévu: {fdate(r.return_date)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{Number(r.total_amount).toLocaleString('fr-MA')} MAD</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => setPaymentDialog({ id: r.id, ref: r.reservation_number })}>
                      Paiements
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {paymentDialog && (
        <PaymentDialog
          open={!!paymentDialog}
          onOpenChange={(o) => !o && setPaymentDialog(null)}
          reservationId={paymentDialog.id}
          reservationRef={paymentDialog.ref}
        />
      )}
    </>
  );
}

function CreditsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: res } = useCreditReservations();
  const credits = (res as any)?.data?.data ?? [];
  const [paymentDialog, setPaymentDialog] = useState<{ id: string; ref: string } | null>(null);

  const totalCredit = credits.reduce((sum: number, r: any) => sum + Number(r.credit_amount ?? 0), 0);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <IconCreditCard className="h-5 w-5" /> Créances clients
            </DialogTitle>
          </DialogHeader>
          {credits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune créance en attente</p>
          ) : (
            <>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm mb-3">
                Total créances : <strong>{totalCredit.toLocaleString('fr-MA')} MAD</strong> sur <strong>{credits.length}</strong> réservation(s)
              </div>
              <div className="space-y-2">
                {credits.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 border border-amber-100 bg-amber-50/50 rounded-lg text-sm">
                    <div>
                      <div className="font-mono font-medium">{r.reservation_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.client?.full_name ?? `${r.client?.first_name} ${r.client?.last_name}`} · {r.agency?.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-bold text-amber-700">{Number(r.credit_amount).toLocaleString('fr-MA')} MAD</div>
                        <div className="text-xs text-muted-foreground">à encaisser</div>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300"
                        onClick={() => setPaymentDialog({ id: r.id, ref: r.reservation_number })}>
                        Encaisser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {paymentDialog && (
        <PaymentDialog
          open={!!paymentDialog}
          onOpenChange={(o) => !o && setPaymentDialog(null)}
          reservationId={paymentDialog.id}
          reservationRef={paymentDialog.ref}
        />
      )}
    </>
  );
}

export function OverviewView() {
  const { data: res, isLoading } = useDashboardStatistics();
  const stats = res?.data;
  const [showOverdue, setShowOverdue] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  const toArr = (v: unknown): any[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v as object) : []);
  const chartData = toArr(stats?.monthly_revenue).map((m: any) => ({
    month: m.month,
    revenue: Number(m.revenue ?? 0),
  }));

  return (
    <PageContainer scrollable={true}>
    <div className="flex flex-col gap-6 p-6 w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de la flotte et des opérations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-7 w-16 mb-1" /><Skeleton className="h-3 w-32" /></CardContent></Card>
          ))
        ) : (
          <>
            <KpiCard
              title="Véhicules totaux"
              value={stats?.vehicles.total ?? 0}
              sub={`${stats?.vehicles.available ?? 0} disponible · ${stats?.vehicles.rented ?? 0} loué`}
              icon={IconCar}
              iconColor="bg-blue-500"
            />
            <KpiCard
              title="Réservations actives"
              value={stats?.reservations.active ?? 0}
              sub={stats?.reservations.overdue ? `${stats.reservations.overdue} en retard` : `${stats?.reservations.pending ?? 0} en attente`}
              icon={IconCalendar}
              iconColor="bg-violet-500"
              onClick={() => stats?.reservations.overdue ? setShowOverdue(true) : undefined}
            />
            <KpiCard
              title="Revenu mensuel"
              value={`${(stats?.billing.revenue_this_month ?? 0).toLocaleString('fr-MA')} MAD`}
              sub={`${stats?.billing.paid_count ?? 0} factures payées`}
              icon={IconCurrencyDirham}
              iconColor="bg-emerald-500"
            />
            <KpiCard
              title="Clients totaux"
              value={stats?.clients.total ?? 0}
              sub={`${stats?.clients.active ?? 0} actifs`}
              icon={IconUsers}
              iconColor="bg-orange-500"
            />
          </>
        )}
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200" onClick={() => setShowOverdue(true)}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-orange-100">
              <IconClock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Réservations en retard</div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? '…' : `${stats?.reservations.overdue ?? 0} réservation(s) dont la date de retour est dépassée`}
              </div>
            </div>
            <Badge variant="destructive">{stats?.reservations.overdue ?? 0}</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-amber-200" onClick={() => setShowCredits(true)}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-amber-100">
              <IconCreditCard className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Crédits clients</div>
              <div className="text-sm text-muted-foreground">Réservations avec solde restant à encaisser</div>
            </div>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Voir</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart + Expiry Alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenu (12 mois)</CardTitle>
            <CardDescription>Revenu facturé mensuel en MAD</CardDescription>
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
              Expirent bientôt
            </CardTitle>
            <CardDescription>Documents dans 30 jours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : (
              <>
                {[
                  { label: 'Assurances', value: stats?.expiring.insurances ?? 0, icon: IconShield, color: 'text-blue-500', href: '/insurances' },
                  { label: 'Inspections', value: stats?.expiring.inspections ?? 0, icon: IconCertificate, color: 'text-purple-500', href: '/technical-inspections' },
                  { label: 'Vignettes', value: stats?.expiring.vignettes ?? 0, icon: IconReceipt, color: 'text-green-500', href: '/vignettes' },
                  { label: 'Maintenances', value: stats?.expiring.maintenances ?? 0, icon: IconTool, color: 'text-orange-500', href: '/maintenances' },
                ].map(({ label, value, icon: Icon, color, href }) => (
                  <Link key={label} href={href} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <Badge variant={value > 0 ? 'destructive' : 'secondary'}>{value}</Badge>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reservation breakdown */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : (
          [
            { label: 'En attente', value: stats?.reservations.pending ?? 0, color: 'text-amber-600', filter: 'pending' },
            { label: 'Confirmées', value: stats?.reservations.confirmed ?? 0, color: 'text-blue-600', filter: 'confirmed' },
            { label: 'Actives', value: stats?.reservations.active ?? 0, color: 'text-green-600', filter: 'active' },
            { label: 'Terminées', value: stats?.reservations.completed ?? 0, color: 'text-slate-600', filter: 'completed' },
            { label: 'Annulées', value: stats?.reservations.cancelled ?? 0, color: 'text-red-600', filter: 'cancelled' },
            { label: 'En retard', value: stats?.reservations.overdue ?? 0, color: 'text-rose-700', filter: null, onClick: () => setShowOverdue(true) },
          ].map(({ label, value, color, filter, onClick }) => (
            <Card key={label} className={`text-center ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`} onClick={onClick}>
              <CardContent className="pt-4 pb-3">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent reservations */}
      {stats?.recent_reservations && stats.recent_reservations.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dernières réservations</CardTitle>
            <Button variant="outline" size="sm" asChild><Link href="/reservations">Voir tout</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recent_reservations.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg text-sm hover:bg-muted/50">
                  <div>
                    <div className="font-mono font-medium text-xs">{r.reservation_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.client?.full_name ?? `${r.client?.first_name} ${r.client?.last_name}`} · {r.vehicle?.brand} {r.vehicle?.model}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{Number(r.total_amount).toLocaleString('fr-MA')} MAD</span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    <OverdueModal open={showOverdue} onClose={() => setShowOverdue(false)} />
    <CreditsModal open={showCredits} onClose={() => setShowCredits(false)} />
    </PageContainer>
  );
}
