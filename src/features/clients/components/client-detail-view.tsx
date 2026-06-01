'use client';

import { useState } from 'react';
import { useClientStatistics, useClientReservations } from '../hooks/use-clients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaymentDialog } from '@/features/reservations/components/payment-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import {
  IconCurrencyDirham, IconCalendar, IconArrowLeft, IconAlertTriangle,
  IconUser, IconPhone, IconMail, IconId,
} from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

interface Props { clientId: string }

function fmt(n: number | undefined) { return (n ?? 0).toLocaleString('fr-MA'); }
function fdate(d: string | undefined) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

export function ClientDetailView({ clientId }: Props) {
  const { data: statsRes, isLoading } = useClientStatistics(clientId);
  const { data: reservationsRes } = useClientReservations(clientId, { per_page: 15 });
  const [paymentDialogId, setPaymentDialogId] = useState<{ id: string; ref: string } | null>(null);

  const stats = statsRes?.data;
  const client = stats?.client;
  const reservations = (reservationsRes as any)?.data?.data ?? [];
  const creditReservations = stats?.credit_reservations ?? [];

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div></PageContainer>;
  }

  if (!stats) return <PageContainer><div className="p-6 text-muted-foreground">Client introuvable.</div></PageContainer>;

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients"><IconArrowLeft className="h-4 w-4 mr-1" />Retour</Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{client?.first_name} {client?.last_name}</h1>
            <p className="text-muted-foreground text-sm">{client?.phone}</p>
          </div>
          {client?.is_blacklisted && (
            <Badge variant="destructive">Blacklisté</Badge>
          )}
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total dû', value: `${fmt(stats.financials?.total_amount)} MAD`, icon: IconCurrencyDirham, color: 'bg-blue-500' },
            { label: 'Total payé', value: `${fmt(stats.financials?.total_paid)} MAD`, icon: IconCurrencyDirham, color: 'bg-emerald-500' },
            { label: 'Crédit restant', value: `${fmt(stats.financials?.credit_balance)} MAD`, icon: IconAlertTriangle, color: stats.financials?.credit_balance > 0 ? 'bg-orange-500' : 'bg-gray-400' },
            { label: 'Réservations', value: stats.reservations?.total ?? 0, icon: IconCalendar, color: 'bg-violet-500' },
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

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="reservations">Réservations ({stats.reservations?.total ?? 0})</TabsTrigger>
            {creditReservations.length > 0 && (
              <TabsTrigger value="credits" className="text-orange-600">Crédits ({creditReservations.length})</TabsTrigger>
            )}
          </TabsList>

          {/* Info */}
          <TabsContent value="info" className="mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Identité</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ['Prénom', client?.first_name],
                    ['Nom', client?.last_name],
                    ['Email', client?.email ?? '—'],
                    ['Téléphone', client?.phone],
                    ['Date de naissance', fdate(client?.date_of_birth)],
                    ['Nationalité', client?.nationality ?? '—'],
                    ['Ville', client?.city ?? '—'],
                    ['Pays', client?.country ?? '—'],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{v as string}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ['Type pièce d\'identité', client?.id_type ?? '—'],
                    ['N° pièce d\'identité', client?.id_number ?? '—'],
                    ['Expiration CIN/Passeport', fdate(client?.id_expiry_date)],
                    ['N° permis', client?.driving_license_number ?? '—'],
                    ['Catégorie permis', client?.driving_license_category ?? '—'],
                    ['Expiration permis', fdate(client?.driving_license_expiry)],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{v as string}</span>
                    </div>
                  ))}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {client?.id_document && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={client.id_document} target="_blank" rel="noreferrer">Voir CIN/Passeport</a>
                      </Button>
                    )}
                    {client?.driving_license_doc && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={client.driving_license_doc} target="_blank" rel="noreferrer">Voir Permis</a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reservation stats */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Terminées', value: stats.reservations?.completed ?? 0, color: 'text-green-600' },
                { label: 'Actives', value: stats.reservations?.active ?? 0, color: 'text-blue-600' },
                { label: 'Annulées', value: stats.reservations?.cancelled ?? 0, color: 'text-red-600' },
                { label: 'Total', value: stats.reservations?.total ?? 0, color: 'text-slate-700' },
              ].map(({ label, value, color }) => (
                <Card key={label} className="text-center">
                  <CardContent className="pt-4 pb-3">
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reservations */}
          <TabsContent value="reservations" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Historique des réservations</CardTitle></CardHeader>
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
                            {r.vehicle?.brand} {r.vehicle?.model} · {r.vehicle?.registration_number}
                          </div>
                          <div className="text-xs text-muted-foreground">{fdate(r.pickup_date)} → {fdate(r.return_date)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold">{fmt(r.total_amount)} MAD</div>
                            <div className="text-xs text-muted-foreground">{r.payment_status}</div>
                          </div>
                          <StatusBadge status={r.status} />
                          <Button variant="ghost" size="sm" className="h-7 text-xs"
                            onClick={() => setPaymentDialogId({ id: r.id, ref: r.reservation_number })}>
                            <IconCurrencyDirham className="h-3.5 w-3.5 mr-1" />Paiements
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits */}
          {creditReservations.length > 0 && (
            <TabsContent value="credits" className="mt-4">
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="text-base text-orange-700 flex items-center gap-2">
                    <IconAlertTriangle className="h-4 w-4" />
                    Créances en attente — {fmt(stats.financials?.credit_balance)} MAD
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {creditReservations.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-3 border border-orange-100 bg-orange-50 rounded-lg text-sm">
                        <div>
                          <div className="font-mono font-medium">{r.reservation_number}</div>
                          <div className="text-xs text-muted-foreground">
                            Payé: {fmt(r.paid_amount)} / {fmt(r.total_amount)} MAD
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-orange-700">{fmt(r.credit_amount)} MAD restant</span>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-orange-300"
                            onClick={() => setPaymentDialogId({ id: r.id, ref: r.reservation_number })}>
                            Encaisser
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {paymentDialogId && (
        <PaymentDialog
          open={!!paymentDialogId}
          onOpenChange={(o) => !o && setPaymentDialogId(null)}
          reservationId={paymentDialogId.id}
          reservationRef={paymentDialogId.ref}
        />
      )}
    </PageContainer>
  );
}
