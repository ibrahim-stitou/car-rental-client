'use client';

import { useState } from 'react';
import { useVehicle, useVehicleStatistics, useVehicleReservations, useVehicleExpenses } from '../hooks/use-vehicles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/status-badge';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { PaymentDialog } from '@/features/reservations/components/payment-dialog';
import { DocumentsSection } from '@/components/shared/documents-section';
import { RichTextContent } from '@/components/shared/rich-text-content';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import {
  IconCar, IconCurrencyDirham, IconTool, IconShield, IconCertificate,
  IconCalendar, IconReceipt, IconArrowLeft, IconPlus, IconGauge,
  IconBuildingStore, IconMapPin, IconPhone, IconWorld, IconFileText,
} from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import { apiRoutes } from '@/config/apiRoutes';

interface Props { vehicleId: string }

function fmt(n: number | undefined) {
  return (n ?? 0).toLocaleString('fr-MA');
}

function fdate(d: string | undefined) {
  if (!d) return '—';
  return format(new Date(d), 'dd MMM yyyy', { locale: fr });
}

export function VehicleDetailView({ vehicleId }: Props) {
  const { data: vehicleRes, isLoading: loadingVehicle, isError: vehicleError } = useVehicle(vehicleId);
  const { data: statsRes, isLoading: loadingStats, refetch: refetchStats } = useVehicleStatistics(vehicleId);
  const { data: reservationsRes } = useVehicleReservations(vehicleId, { per_page: 10 });
  const { data: expensesRes } = useVehicleExpenses(vehicleId, { per_page: 10 });
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [paymentDialogId, setPaymentDialogId] = useState<{ id: string; ref: string } | null>(null);

  const vehicle = vehicleRes?.data;
  const stats = statsRes?.data;
  const reservations = (reservationsRes as any)?.data?.data ?? [];
  const expenses = (expensesRes as any)?.data?.data ?? [];

  if (loadingVehicle) {
    return <PageContainer><div className="p-6 space-y-4 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div></PageContainer>;
  }

  if (vehicleError || !vehicle) return (
    <PageContainer>
      <div className="p-6">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href="/vehicles"><IconArrowLeft className="h-4 w-4 mr-1" />Retour</Link>
        </Button>
        <div className="text-muted-foreground">Véhicule introuvable ou inaccessible (ID: {vehicleId}).</div>
      </div>
    </PageContainer>
  );

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/vehicles"><IconArrowLeft className="h-4 w-4 mr-1" />Retour</Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{vehicle.brand} {vehicle.model} {vehicle.year}</h1>
            <p className="text-muted-foreground text-sm font-mono">{vehicle.registration_number}</p>
          </div>
          <StatusBadge status={vehicle.status} />
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Revenus totaux', value: `${fmt(stats?.financials?.total_revenue)} MAD`, icon: IconCurrencyDirham, color: 'bg-emerald-500' },
            { label: 'Coûts totaux', value: `${fmt((stats?.financials?.maintenance_cost ?? 0) + (stats?.financials?.expense_cost ?? 0))} MAD`, icon: IconTool, color: 'bg-red-500' },
            { label: 'Résultat net', value: `${fmt(stats?.financials?.net_revenue)} MAD`, icon: IconGauge, color: 'bg-blue-500' },
            { label: 'Réservations', value: stats?.reservations?.total ?? 0, icon: IconCalendar, color: 'bg-violet-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                <div className={`p-1.5 rounded-lg ${color}`}><Icon className="h-4 w-4 text-white" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="website">Aperçu site web</TabsTrigger>
            <TabsTrigger value="reservations">Réservations</TabsTrigger>
            <TabsTrigger value="expenses">Dépenses</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Info tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Photo gallery */}
            <Card>
              <CardHeader><CardTitle className="text-base">Photos du véhicule</CardTitle></CardHeader>
              <CardContent>
                {vehicle.photos && vehicle.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {vehicle.photos.map((photo) => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer"
                        className="block rounded-lg overflow-hidden border bg-muted aspect-video hover:opacity-90 transition-opacity">
                        <img src={photo.url} alt={photo.file_name} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune photo disponible</p>
                )}
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Caractéristiques</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ['Catégorie', vehicle.category],
                    ['Carburant', vehicle.fuel_type],
                    ['Transmission', vehicle.transmission],
                    ['Places', vehicle.seats],
                    ['Couleur', vehicle.color],
                    ['VIN', vehicle.vin ?? '—'],
                    ['Kilométrage', `${fmt(vehicle.mileage)} km`],
                    ['Consommation moyenne', vehicle.average_consumption != null ? `${vehicle.average_consumption} L/100km` : '—'],
                    ['Tarif journalier', `${fmt(vehicle.daily_rate)} MAD`],
                    ['Caution', `${fmt(vehicle.deposit_amount)} MAD`],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{v as string}</span>
                    </div>
                  ))}
                  {vehicle.description && (
                    <div className="pt-2">
                      <span className="text-muted-foreground block mb-1">Description</span>
                      <RichTextContent html={vehicle.description} />
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                {/* Agency */}
                {vehicle.agency && (
                  <Card>
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                      <IconBuildingStore className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">Agence</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1.5">
                      <Link href={`/agencies/${vehicle.agency.id}`} className="font-medium hover:underline">
                        {vehicle.agency.name}
                      </Link>
                      {vehicle.agency.city && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <IconMapPin className="h-3.5 w-3.5" />{vehicle.agency.city}
                        </div>
                      )}
                      {vehicle.agency.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <IconPhone className="h-3.5 w-3.5" />{vehicle.agency.phone}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                {/* Current insurance */}
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <IconShield className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm">Assurance en cours</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {stats?.current_insurance ? (
                      <div className="space-y-1">
                        <div className="font-medium">{stats.current_insurance.insurance_company}</div>
                        <div className="text-muted-foreground">Police: {stats.current_insurance.policy_number}</div>
                        <div className="text-muted-foreground">Expire: {fdate(stats.current_insurance.end_date)}</div>
                        <Badge variant="outline" className="text-xs">{stats.current_insurance.insurance_type}</Badge>
                      </div>
                    ) : <p className="text-muted-foreground">Aucune assurance active</p>}
                  </CardContent>
                </Card>

                {/* Last inspection */}
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <IconCertificate className="h-4 w-4 text-purple-500" />
                    <CardTitle className="text-sm">Dernière visite technique</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {stats?.last_inspection ? (
                      <div className="space-y-1">
                        <div className="font-medium">{stats.last_inspection.center ?? '—'}</div>
                        <div className="text-muted-foreground">Date: {fdate(stats.last_inspection.inspection_date)}</div>
                        <div className="text-muted-foreground">Prochaine: {fdate(stats.last_inspection.next_inspection_date)}</div>
                        <Badge variant={stats.last_inspection.result === 'passed' ? 'default' : 'destructive'} className="text-xs">
                          {stats.last_inspection.result === 'passed' ? 'Réussie' : 'Échouée'}
                        </Badge>
                      </div>
                    ) : <p className="text-muted-foreground">Aucune visite enregistrée</p>}
                  </CardContent>
                </Card>

                {/* Pending maintenances */}
                {stats?.pending_maintenances?.length > 0 && (
                  <Card className="border-orange-200">
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                      <IconTool className="h-4 w-4 text-orange-500" />
                      <CardTitle className="text-sm text-orange-700">Maintenances à venir</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {stats.pending_maintenances.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between text-sm">
                          <span>{m.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{fdate(m.maintenance_date)}</span>
                            <Badge variant="outline" className="text-xs">{m.priority}</Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Website preview tab */}
          <TabsContent value="website" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <IconWorld className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Aperçu — telle qu'affichée sur le site web</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {vehicle.show_on_website ? 'Ce véhicule est actuellement visible sur le site public.' : "Ce véhicule n'est pas affiché sur le site public."}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-w-md mx-auto border rounded-xl overflow-hidden shadow-sm">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {vehicle.photos?.[0] ? (
                      <img src={vehicle.photos[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <IconCar className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{vehicle.brand} {vehicle.model} {vehicle.year}</h3>
                      <Badge variant="secondary">{vehicle.category}</Badge>
                    </div>
                    <div className="text-primary font-bold text-xl">
                      {fmt(vehicle.website_price ?? vehicle.daily_rate)} MAD<span className="text-sm font-normal text-muted-foreground">/jour</span>
                    </div>
                    {vehicle.website_description ? (
                      <RichTextContent html={vehicle.website_description} />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Aucune description site web renseignée</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservations tab */}
          <TabsContent value="reservations" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Historique des réservations</CardTitle>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <span>Total: <strong>{stats?.reservations?.total ?? 0}</strong></span>
                  <span>Jours loués: <strong>{fmt(stats?.reservations?.total_days)}</strong></span>
                </div>
              </CardHeader>
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
                            {r.client?.full_name ?? r.client?.first_name} · {fdate(r.pickup_date)} → {fdate(r.return_date)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{fmt(r.total_amount)} MAD</span>
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

          {/* Expenses tab */}
          <TabsContent value="expenses" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Dépenses du véhicule</CardTitle>
                <Button size="sm" onClick={() => setExpenseFormOpen(true)}>
                  <IconPlus className="h-4 w-4 mr-1" />Ajouter
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-muted/50 rounded-lg text-sm">
                  <div><span className="text-muted-foreground">Maintenance: </span><strong>{fmt(stats?.financials?.maintenance_cost)} MAD</strong></div>
                  <div><span className="text-muted-foreground">Autres dépenses: </span><strong>{fmt(stats?.financials?.expense_cost)} MAD</strong></div>
                </div>
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

          {/* Documents tab */}
          <TabsContent value="documents" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Tous les documents liés</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {vehicle.registration_card && (
                  <div className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <span className="flex items-center gap-2"><IconFileText className="h-4 w-4 text-muted-foreground" />Carte grise</span>
                    <Button size="sm" variant="outline" asChild>
                      <a href={vehicle.registration_card} target="_blank" rel="noreferrer">Voir</a>
                    </Button>
                  </div>
                )}
                {(!stats?.documents || stats.documents.length === 0) && !vehicle.registration_card ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun document disponible</p>
                ) : (
                  (stats?.documents ?? []).map((doc: any) => (
                    <div key={`${doc.source}-${doc.id}`} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{doc.file_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">{doc.source}</Badge>
                          {doc.source_label}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={doc.url} target="_blank" rel="noreferrer">Voir</a>
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <DocumentsSection
              title="Ajouter un document"
              entityId={vehicleId}
              uploadUrl={apiRoutes.vehiclesExt.documents(vehicleId)}
              deleteUrlFn={(mediaId) => apiRoutes.vehiclesExt.deleteMedia(vehicleId, mediaId)}
              initialDocuments={(stats?.documents ?? []).filter((d: any) => d.source === 'Véhicule' && d.source_label === 'Document')}
              accept="application/pdf,image/*"
              onRefresh={() => refetchStats()}
              titled
            />
          </TabsContent>
        </Tabs>
      </div>

      <ExpenseForm
        open={expenseFormOpen}
        onOpenChange={setExpenseFormOpen}
        defaultVehicleId={vehicleId}
      />

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
