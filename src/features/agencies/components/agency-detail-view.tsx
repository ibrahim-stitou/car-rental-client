'use client';

import { useEffect, useRef, useState } from 'react';
import { useAgencyStatistics, useUploadAgencyLogo, useDeleteAgencyMedia } from '../hooks/use-agencies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/status-badge';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { PaymentDialog } from '@/features/reservations/components/payment-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Camera, Trash2 } from 'lucide-react';
import {
  IconCar, IconCurrencyDirham, IconUsers, IconCalendar,
  IconArrowLeft, IconPlus, IconAlertTriangle, IconBuildingStore,
} from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { AgencyStatDialog, type AgencyStatType } from './agency-stat-dialog';

interface Props { agencyId: string }

function fmt(n: number | undefined) { return (n ?? 0).toLocaleString('fr-MA'); }
function fdate(d: string | undefined) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

export function AgencyDetailView({ agencyId }: Props) {
  const { data: statsRes, isLoading } = useAgencyStatistics(agencyId);
  const { data: expensesRes } = useExpenses({ agency_id: agencyId, per_page: 15 });
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [paymentDialogId, setPaymentDialogId] = useState<{ id: string; ref: string } | null>(null);
  const [statDialogType, setStatDialogType] = useState<AgencyStatType | null>(null);

  const uploadLogo = useUploadAgencyLogo(agencyId);
  const deleteLogo = useDeleteAgencyMedia(agencyId);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoMediaId, setLogoMediaId] = useState<number | null>(null);
  const [logoDelConfirm, setLogoDelConfirm] = useState(false);

  const { data: reservationsRes } = useQuery({
    queryKey: ['agencies', agencyId, 'reservations'],
    queryFn: () => apiClient.get(apiRoutes.reservations.list, { params: { agency_id: agencyId, per_page: 10 } }).then((r) => r.data),
    enabled: !!agencyId,
  });

  const stats = statsRes?.data;
  const agency = stats?.agency;
  const reservations = (reservationsRes as any)?.data ?? [];
  const expenses = expensesRes?.data ?? [];

  useEffect(() => {
    setLogoUrl((agency as any)?.logo_url ?? null);
    setLogoMediaId((agency as any)?.logo_media_id ?? null);
  }, [(agency as any)?.logo_url, (agency as any)?.logo_media_id]);

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div></PageContainer>;
  }

  if (!stats) return <PageContainer><div className="p-6 text-muted-foreground">Agence introuvable.</div></PageContainer>;

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/agencies"><IconArrowLeft className="h-4 w-4 mr-1" />Retour</Link>
          </Button>

          {/* Logo avatar with upload overlay */}
          <div className="relative group flex-shrink-0">
            <div className="h-16 w-16 rounded-xl overflow-hidden border bg-muted flex items-center justify-center">
              {logoUrl
                ? <img src={logoUrl} alt={agency?.name} className="h-full w-full object-cover" />
                : <IconBuildingStore className="h-7 w-7 text-muted-foreground" />
              }
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadLogo.isPending}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer rounded-xl"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoDelConfirm(true)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3 text-white" />
              </button>
            )}
          </div>
          <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            uploadLogo.mutate(file, {
              onSuccess: (res) => {
                const updated = (res as any)?.data;
                setLogoUrl(updated?.logo_url ?? null);
                setLogoMediaId(updated?.logo_media_id ?? null);
              },
            });
            e.target.value = '';
          }} />

          {/* Inline delete confirm */}
          {logoDelConfirm && (
            <div className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="text-red-700 font-medium">Supprimer le logo ?</span>
              <Button type="button" variant="destructive" size="sm" className="h-6 text-xs px-2" disabled={deleteLogo.isPending}
                onClick={() => deleteLogo.mutate(logoMediaId!, {
                  onSuccess: () => { setLogoUrl(null); setLogoMediaId(null); setLogoDelConfirm(false); },
                })}>Oui</Button>
              <Button type="button" variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setLogoDelConfirm(false)}>Non</Button>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{agency?.name}</h1>
            <p className="text-muted-foreground text-sm">{agency?.city} · {agency?.phone}{agency?.phone2 ? ` · GSM ${agency.phone2}` : ''}</p>
          </div>
          <Badge variant={agency?.is_active ? 'default' : 'secondary'}>{agency?.is_active ? 'Active' : 'Inactive'}</Badge>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Revenus', value: `${fmt(stats.financials?.total_revenue)} MAD`, icon: IconCurrencyDirham, color: 'bg-emerald-500' },
            { label: 'Dépenses', value: `${fmt(stats.financials?.total_expenses)} MAD`, icon: IconCurrencyDirham, color: 'bg-red-500' },
            { label: 'Résultat net', value: `${fmt(stats.financials?.net_revenue)} MAD`, icon: IconCurrencyDirham, color: 'bg-blue-500' },
            { label: 'Crédit client', value: `${fmt(stats.financials?.total_credit)} MAD`, icon: IconAlertTriangle, color: 'bg-orange-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                <div className={`p-1.5 rounded-lg ${color}`}><Icon className="h-4 w-4 text-white" /></div>
              </CardHeader>
              <CardContent><div className="text-xl font-bold">{value}</div></CardContent>
            </Card>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Véhicules', value: stats.vehicles?.total ?? 0, sub: `${stats.vehicles?.available ?? 0} dispo`, type: 'vehicles' as AgencyStatType },
            { label: 'Loués', value: stats.vehicles?.rented ?? 0, sub: `${stats.vehicles?.maintenance ?? 0} maint.`, type: 'rented' as AgencyStatType },
            { label: 'Réservations', value: stats.reservations?.total ?? 0, sub: `${stats.reservations?.active ?? 0} actives`, type: 'reservations' as AgencyStatType },
            { label: 'En retard', value: stats.reservations?.overdue ?? 0, sub: '', type: 'overdue' as AgencyStatType },
            { label: 'Clients', value: stats.clients?.total ?? 0, sub: `${stats.clients?.blacklisted ?? 0} blacklistés`, type: 'clients' as AgencyStatType },
          ].map(({ label, value, sub, type }) => (
            <Card key={label} className="text-center cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
              onClick={() => setStatDialogType(type)}>
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                {sub && <div className="text-xs text-muted-foreground/70">{sub}</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="reservations">
          <TabsList>
            <TabsTrigger value="reservations">Réservations</TabsTrigger>
            <TabsTrigger value="expenses">Dépenses</TabsTrigger>
            <TabsTrigger value="credits">Crédits ({stats.financials?.credit_count ?? 0})</TabsTrigger>
          </TabsList>

          {/* Reservations */}
          <TabsContent value="reservations" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Dernières réservations</CardTitle></CardHeader>
              <CardContent>
                {reservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune réservation</p>
                ) : (
                  <div className="space-y-2">
                    {reservations.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg text-sm hover:bg-muted/50">
                        <div>
                          <div className="font-mono font-medium">{r.reservation_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.client?.full_name ?? r.client?.first_name} · {r.vehicle?.brand} {r.vehicle?.model}
                          </div>
                          <div className="text-xs text-muted-foreground">{fdate(r.pickup_date)} → {fdate(r.return_date)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{fmt(r.total_amount)} MAD</span>
                          <StatusBadge status={r.status} />
                          <Button variant="ghost" size="sm" className="h-7 text-xs"
                            onClick={() => setPaymentDialogId({ id: r.id, ref: r.reservation_number })}>
                            Paiements
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses */}
          <TabsContent value="expenses" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Dépenses de l'agence</CardTitle>
                <Button size="sm" onClick={() => setExpenseFormOpen(true)}>
                  <IconPlus className="h-4 w-4 mr-1" />Ajouter
                </Button>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune dépense enregistrée</p>
                ) : (
                  <div className="space-y-2">
                    {expenses.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <div>
                          <div className="font-medium">{e.title}</div>
                          <div className="text-xs text-muted-foreground">{e.category} · {fdate(e.expense_date)}</div>
                        </div>
                        <span className="font-semibold text-red-600">{fmt(e.amount)} MAD</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits */}
          <TabsContent value="credits" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-orange-700">Créances clients</CardTitle>
              </CardHeader>
              <CardContent>
                {!stats.financials?.credit_count ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune créance en attente</p>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-orange-50 rounded-lg text-sm">
                      <strong>{fmt(stats.financials.total_credit)} MAD</strong> de créances sur <strong>{stats.financials.credit_count}</strong> réservation(s)
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ExpenseForm
        open={expenseFormOpen}
        onOpenChange={setExpenseFormOpen}
        defaultAgencyId={agencyId}
      />

      {paymentDialogId && (
        <PaymentDialog
          open={!!paymentDialogId}
          onOpenChange={(o) => !o && setPaymentDialogId(null)}
          reservationId={paymentDialogId.id}
          reservationRef={paymentDialogId.ref}
        />
      )}

      <AgencyStatDialog agencyId={agencyId} type={statDialogType} onOpenChange={(o) => !o && setStatDialogType(null)} />
    </PageContainer>
  );
}
