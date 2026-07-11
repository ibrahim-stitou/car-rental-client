'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Pencil, AlertTriangle } from 'lucide-react';
import { IconShield, IconCurrencyDirham, IconUser } from '@tabler/icons-react';
import { useClaim } from '../hooks/use-claims';
import type { MediaItem } from '@/types/claim.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { DocumentsSection } from '@/components/shared/documents-section';
import PageContainer from '@/components/layout/page-container';
import { apiRoutes } from '@/config/apiRoutes';
import { CLAIM_STATUS_OPTIONS } from '@/config/constants';
import { useParameterOptions } from '@/features/settings/hooks/use-parameters';

interface Props { claimId: string }

function fmt(n: number | undefined) { return (n ?? 0).toLocaleString('fr-MA'); }
function fdate(d: string | undefined | null) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

export function ClaimDetailView({ claimId }: Props) {
  const { data: res, isLoading, refetch } = useClaim(claimId);
  const claim = res?.data;
  const { options: accidentTypeOptions } = useParameterOptions('accident_type');

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></PageContainer>;
  }
  if (!claim) {
    return <PageContainer><div className="p-6 text-muted-foreground">Sinistre introuvable.</div></PageContainer>;
  }

  const statusOpt = CLAIM_STATUS_OPTIONS.find(o => o.value === claim.status);
  const typeOpt = accidentTypeOptions.find(o => o.value === claim.accident_type);
  const netLoss = (claim.total_damage_amount ?? 0)
    - (claim.insurance_amount_recovered ?? 0)
    - (claim.client_paid_amount ?? 0);

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/claims"><ArrowLeft className="h-4 w-4 mr-1" />Sinistres</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                {claim.claim_number}
              </h1>
              <p className="text-sm text-muted-foreground">{claim.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${statusOpt?.color ?? ''}`}>{statusOpt?.label ?? claim.status}</Badge>
            <Button size="sm" asChild>
              <Link href={`/claims/${claimId}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" />Modifier</Link>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Véhicule & client</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Véhicule</p>
                  <p className="font-semibold">{claim.vehicle?.brand} {claim.vehicle?.model}</p>
                  <p className="text-sm text-muted-foreground font-mono">{claim.vehicle?.registration_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Client impliqué</p>
                  {claim.client ? (
                    <>
                      <p className="font-semibold flex items-center gap-1">
                        <IconUser className="h-4 w-4" />{claim.client.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{claim.client.phone}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucun client associé (équipe)</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{fdate(claim.claim_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <Badge variant="outline" className="mt-0.5">{typeOpt?.label ?? claim.accident_type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Responsabilité</p>
                  <Badge variant="outline" className={`mt-0.5 ${claim.is_client_responsible ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                    {claim.is_client_responsible ? 'Client responsable' : 'Équipe / Autre'}
                  </Badge>
                </div>
              </div>

              {claim.description && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm">{claim.description}</p>
                </div>
              )}
              {claim.responsible_notes && (
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                  <strong>Circonstances : </strong>{claim.responsible_notes}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-1.5"><IconCurrencyDirham className="h-4 w-4" />Détail financier</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Montant total des dégâts', value: claim.total_damage_amount, cls: 'text-red-600' },
                  { label: 'Remboursement assurance', value: claim.insurance_amount_recovered, cls: 'text-green-600' },
                  { label: 'Payé par le client', value: claim.client_paid_amount, cls: 'text-green-600' },
                  { label: 'Charge entreprise', value: claim.company_expense_amount, cls: 'text-orange-600' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-semibold ${cls}`}>{fmt(Number(value))} MAD</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm py-2 bg-muted/30 rounded px-2">
                  <span className="font-semibold">Perte nette entreprise</span>
                  <span className={`font-bold text-lg ${netLoss > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {fmt(netLoss)} MAD
                  </span>
                </div>
              </CardContent>
            </Card>

            {(claim.insurance_reference || claim.insurance_claim_date || claim.settlement_date) && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-1.5"><IconShield className="h-4 w-4" />Assurance</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  {claim.insurance_reference && (
                    <div><p className="text-xs text-muted-foreground">Référence</p><p className="font-mono font-medium">{claim.insurance_reference}</p></div>
                  )}
                  {claim.insurance_claim_date && (
                    <div><p className="text-xs text-muted-foreground">Date déclaration</p><p className="font-medium">{fdate(claim.insurance_claim_date)}</p></div>
                  )}
                  {claim.settlement_date && (
                    <div><p className="text-xs text-muted-foreground">Règlement</p><p className="font-medium">{fdate(claim.settlement_date)}</p></div>
                  )}
                </CardContent>
              </Card>
            )}

            {claim.agent_notes && (
              <Card>
                <CardHeader><CardTitle className="text-base">Notes agent</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{claim.agent_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Photos & documents</h2>

          <Card>
            <CardHeader><CardTitle className="text-base">Photos du sinistre</CardTitle></CardHeader>
            <CardContent>
              {claim.photos && claim.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {claim.photos.map((photo: MediaItem) => (
                    <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer"
                      className="block rounded-lg overflow-hidden border bg-muted aspect-video hover:opacity-90 transition-opacity">
                      <img src={photo.url} alt={photo.name || photo.file_name} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune photo disponible</p>
              )}
            </CardContent>
          </Card>

          <DocumentsSection
            title="Gérer les photos"
            entityId={claim.id}
            uploadUrl={apiRoutes.claims.uploadPhotos(claim.id)}
            deleteUrlFn={(mid) => apiRoutes.claims.deleteMedia(claim.id, mid)}
            initialDocuments={claim.photos}
            fieldName="photos"
            accept="image/*"
            compact
            onRefresh={() => refetch()}
          />
          <DocumentsSection
            title="Documents"
            entityId={claim.id}
            uploadUrl={apiRoutes.claims.uploadDocs(claim.id)}
            deleteUrlFn={(mid) => apiRoutes.claims.deleteMedia(claim.id, mid)}
            initialDocuments={claim.documents}
            accept="application/pdf,image/*"
            compact
            onRefresh={() => refetch()}
          />
          <DocumentsSection
            title="Documents assurance"
            entityId={claim.id}
            uploadUrl={apiRoutes.claims.uploadInsuranceDocs(claim.id)}
            deleteUrlFn={(mid) => apiRoutes.claims.deleteMedia(claim.id, mid)}
            initialDocuments={claim.insurance_documents}
            accept="application/pdf,image/*"
            compact
            onRefresh={() => refetch()}
          />
        </div>
      </div>
    </PageContainer>
  );
}
