'use client';

import { useState } from 'react';
import { useClientStatistics, useClientReservations, useUploadIdDocument, useUploadDrivingLicense, useUploadSelfie, useDeleteClientMedia } from '../hooks/use-clients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaymentDialog } from '@/features/reservations/components/payment-dialog';
import { FileUploader } from '@/components/file-uploader';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import {
  IconCurrencyDirham, IconCalendar, IconArrowLeft, IconAlertTriangle,
  IconEdit, IconFileText,
} from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

interface Props { clientId: string }

const ID_TYPE_LABELS: Record<string, string> = {
  cin: 'CIN',
  passport: 'Passeport',
  residence_permit: 'Titre de séjour',
};

function fmt(n: number | undefined) { return (n ?? 0).toLocaleString('fr-MA'); }
function fdate(d: string | undefined) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

function DocViewer({ url, label }: { url: string; label: string }) {
  const isPdf = url.toLowerCase().includes('.pdf') || url.includes('application/pdf');
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">{label}</div>
      {isPdf ? (
        <iframe src={url} className="w-full h-72" title={label} />
      ) : (
        <img src={url} alt={label} className="w-full max-h-72 object-contain bg-gray-50" />
      )}
    </div>
  );
}

function UploadSection({
  label,
  currentUrl,
  onUpload,
  onDelete,
  isPending,
  isDeleting,
  accept,
}: {
  label: string;
  currentUrl?: string | null;
  onUpload: (file: File) => void;
  onDelete?: () => void;
  isPending: boolean;
  isDeleting?: boolean;
  accept?: Record<string, string[]>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [confirming, setConfirming] = useState(false);

  const handleUpload = async (selected: File[]) => {
    if (selected[0]) {
      setFiles(selected);
      onUpload(selected[0]);
      setFiles([]);
    }
  };

  return (
    <div className="space-y-3">
      {currentUrl ? (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {onDelete && (
              confirming ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Supprimer ?</span>
                  <Button
                    type="button" size="sm" variant="destructive"
                    className="h-6 text-xs px-2"
                    disabled={isDeleting}
                    onClick={() => { onDelete(); setConfirming(false); }}
                  >
                    Oui
                  </Button>
                  <Button
                    type="button" size="sm" variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => setConfirming(false)}
                  >
                    Non
                  </Button>
                </div>
              ) : (
                <Button
                  type="button" size="sm" variant="ghost"
                  className="h-6 text-xs px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={isDeleting}
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Supprimer
                </Button>
              )
            )}
          </div>
          <DocViewer url={currentUrl} label={label} />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Aucun document</p>
      )}
      <div className="relative">
        <FileUploader
          value={files}
          onValueChange={setFiles}
          onUpload={handleUpload}
          accept={accept ?? { 'image/*': [], 'application/pdf': ['.pdf'] }}
          maxSize={5 * 1024 * 1024}
          maxFiles={1}
          disabled={isPending || isDeleting}
        />
        {(isPending || isDeleting) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-lg">
            <span className="text-sm text-muted-foreground">
              {isDeleting ? 'Suppression…' : 'Téléversement…'}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {currentUrl ? 'Déposer un nouveau fichier pour remplacer' : 'JPEG, PNG ou PDF — max 5 Mo'}
      </p>
    </div>
  );
}

export function ClientDetailView({ clientId }: Props) {
  const { data: statsRes, isLoading } = useClientStatistics(clientId);
  const { data: reservationsRes } = useClientReservations(clientId, { per_page: 15 });
  const [paymentDialogId, setPaymentDialogId] = useState<{ id: string; ref: string } | null>(null);

  const uploadId = useUploadIdDocument(clientId);
  const uploadLicense = useUploadDrivingLicense(clientId);
  const uploadSelfie = useUploadSelfie(clientId);
  const deleteMedia = useDeleteClientMedia(clientId);

  const stats = statsRes?.data;
  const client = stats?.client;
  const reservations = (reservationsRes as any)?.data?.data ?? [];
  const creditReservations = stats?.credit_reservations ?? [];

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div></PageContainer>;
  }

  if (!stats) return <PageContainer><div className="p-6 text-muted-foreground">Client introuvable.</div></PageContainer>;

  const handleUpload = (mutation: typeof uploadId, label: string) => async (file: File) => {
    mutation.mutate(file, {
      onSuccess: () => toast.success(`${label} téléversé avec succès`),
      onError: () => toast.error('Échec du téléversement'),
    });
  };

  const handleDelete = (mediaId: number | null | undefined, label: string) => () => {
    if (!mediaId) return;
    deleteMedia.mutate(mediaId, {
      onSuccess: () => toast.success(`${label} supprimé`),
      onError: () => toast.error('Échec de la suppression'),
    });
  };

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients"><IconArrowLeft className="h-4 w-4 mr-1" />Retour</Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{client?.first_name} {client?.last_name}</h1>
            <p className="text-muted-foreground text-sm">{client?.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            {client?.is_blacklisted && <Badge variant="destructive">Blacklisté</Badge>}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/clients/${clientId}/edit`}>
                <IconEdit className="h-4 w-4 mr-1" />Modifier
              </Link>
            </Button>
          </div>
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
            <TabsTrigger value="documents">Documents</TabsTrigger>
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
                    ['Lieu de naissance', client?.birth_place ?? '—'],
                    ['Nationalité', client?.nationality ?? '—'],
                    ['Adresse', client?.address ?? '—'],
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
                <CardHeader><CardTitle className="text-base">Documents officiels</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ['Type pièce d\'identité', client?.id_type ? ID_TYPE_LABELS[client.id_type] ?? client.id_type : '—'],
                    ['N° pièce d\'identité', client?.id_number ?? '—'],
                    ['Expiration CIN/Passeport', fdate(client?.id_expiry_date)],
                    ['N° permis', client?.driving_license_number ?? '—'],
                    ['Catégorie permis', client?.driving_license_category ?? '—'],
                    ['Expiration permis', fdate(client?.driving_license_expiry)],
                    ['Délivré le', fdate(client?.license_issue_date)],
                    ['Délivré à', client?.license_issue_place ?? '—'],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{v as string}</span>
                    </div>
                  ))}
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

          {/* Documents */}
          <TabsContent value="documents" className="mt-4">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconFileText className="h-4 w-4" />CIN / Passeport
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UploadSection
                    label="Pièce d'identité"
                    currentUrl={client?.id_document}
                    onUpload={handleUpload(uploadId, "Pièce d'identité")}
                    onDelete={client?.id_document_media_id ? handleDelete(client.id_document_media_id, "Pièce d'identité") : undefined}
                    isPending={uploadId.isPending}
                    isDeleting={deleteMedia.isPending}
                    accept={{ 'image/jpeg': [], 'image/png': [], 'application/pdf': ['.pdf'] }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconFileText className="h-4 w-4" />Permis de conduire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UploadSection
                    label="Permis de conduire"
                    currentUrl={client?.driving_license_doc}
                    onUpload={handleUpload(uploadLicense, 'Permis de conduire')}
                    onDelete={client?.driving_license_media_id ? handleDelete(client.driving_license_media_id, 'Permis de conduire') : undefined}
                    isPending={uploadLicense.isPending}
                    isDeleting={deleteMedia.isPending}
                    accept={{ 'image/jpeg': [], 'image/png': [], 'application/pdf': ['.pdf'] }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconFileText className="h-4 w-4" />Photo (Selfie)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UploadSection
                    label="Selfie"
                    currentUrl={client?.selfie}
                    onUpload={handleUpload(uploadSelfie, 'Selfie')}
                    onDelete={client?.selfie_media_id ? handleDelete(client.selfie_media_id, 'Selfie') : undefined}
                    isPending={uploadSelfie.isPending}
                    isDeleting={deleteMedia.isPending}
                    accept={{ 'image/jpeg': [], 'image/png': [] }}
                  />
                </CardContent>
              </Card>
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
