'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Pencil, DollarSign } from 'lucide-react';
import { useVignette } from '../hooks/use-vignettes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SingleDocUpload } from '@/components/shared/single-doc-upload';
import { DocumentsSection } from '@/components/shared/documents-section';
import PageContainer from '@/components/layout/page-container';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

interface Props { vignetteId: string }

function fdate(d?: string | null) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

export function VignetteDetailView({ vignetteId }: Props) {
  const { data: res, isLoading, refetch } = useVignette(vignetteId);
  const vignette = res?.data;

  const { data: mediaRes, refetch: refetchMedia } = useQuery({
    queryKey: ['vignettes', vignetteId, 'media'],
    queryFn: () => apiClient.get(apiRoutes.vignettes.media(vignetteId)).then((r) => r.data),
    enabled: !!vignetteId,
  });
  const media = mediaRes?.data ?? {};

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></PageContainer>;
  }
  if (!vignette) {
    return <PageContainer><div className="p-6 text-muted-foreground">Vignette introuvable.</div></PageContainer>;
  }

  const markPaid = async () => {
    try {
      await apiClient.post(apiRoutes.vignettes.markPaid(vignetteId), { payment_method: 'cash' });
      toast.success('Vignette marquée comme payée');
      refetch();
    } catch { toast.error("Échec de l'opération"); }
  };

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full max-w-4xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/vignettes"><ArrowLeft className="h-4 w-4 mr-1" />Vignettes</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{vignette.vehicle.brand} {vignette.vehicle.model} — {vignette.year}</h1>
              <p className="text-sm text-muted-foreground font-mono">{vignette.vehicle.registration_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vignette.is_paid ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Payée</Badge>
            ) : (
              <>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Non payée</Badge>
                <Button size="sm" variant="outline" className="text-green-700" onClick={markPaid}>
                  <DollarSign className="h-3.5 w-3.5 mr-1" />Marquer payée
                </Button>
              </>
            )}
            <Button size="sm" asChild>
              <Link href={`/vignettes/${vignetteId}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" />Modifier</Link>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Année', vignette.year],
                ["Date d'émission", fdate(vignette.issue_date)],
                ["Date d'expiration", fdate(vignette.expiry_date)],
                ['Montant', `${vignette.amount} MAD`],
                ['Mode de paiement', vignette.payment_method || '—'],
                ['Référence', vignette.payment_reference || '—'],
                ['Payée le', fdate(vignette.payment_date)],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v as any}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Commentaire</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vignette.agent_notes || 'Aucun commentaire'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents</h2>
          <SingleDocUpload
            label="Vignette (document)"
            fieldName="document"
            uploadUrl={apiRoutes.vignettes.uploadDocument(vignetteId)}
            currentUrl={media.vignette_document?.[0]?.url}
            accept="image/*,application/pdf"
            onUploaded={() => refetchMedia()}
          />
          <SingleDocUpload
            label="Justificatif de paiement"
            fieldName="payment_proof"
            uploadUrl={apiRoutes.vignettes.uploadPaymentProof(vignetteId)}
            currentUrl={media.payment_proof?.[0]?.url}
            accept="image/*,application/pdf"
            onUploaded={() => refetchMedia()}
          />
          <DocumentsSection
            title="Autres documents"
            entityId={vignetteId}
            uploadUrl={apiRoutes.vignettes.uploadDocuments(vignetteId)}
            deleteUrlFn={(mid) => apiRoutes.vignettes.deleteMedia(vignetteId, mid)}
            initialDocuments={media.documents ?? []}
            onRefresh={() => refetchMedia()}
          />
        </div>
      </div>
    </PageContainer>
  );
}
