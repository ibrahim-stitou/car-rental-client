'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useTechnicalInspection } from '../hooks/use-technical-inspections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SingleDocUpload } from '@/components/shared/single-doc-upload';
import { DocumentsSection } from '@/components/shared/documents-section';
import PageContainer from '@/components/layout/page-container';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

interface Props { inspectionId: string }

const RESULT_CLS: Record<string, string> = {
  passed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
};
const RESULT_FR: Record<string, string> = { passed: 'Réussi', failed: 'Échoué', pending: 'En attente' };

function fdate(d?: string | null) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

export function TechnicalInspectionDetailView({ inspectionId }: Props) {
  const { data: res, isLoading } = useTechnicalInspection(inspectionId);
  const inspection = res?.data;

  const { data: mediaRes, refetch: refetchMedia } = useQuery({
    queryKey: ['technical-inspections', inspectionId, 'media'],
    queryFn: () => apiClient.get(apiRoutes.technicalInspections.media(inspectionId)).then((r) => r.data),
    enabled: !!inspectionId,
  });
  const media = mediaRes?.data ?? {};

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></PageContainer>;
  }
  if (!inspection) {
    return <PageContainer><div className="p-6 text-muted-foreground">Visite technique introuvable.</div></PageContainer>;
  }

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/technical-inspections"><ArrowLeft className="h-4 w-4 mr-1" />Visites techniques</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{inspection.vehicle.brand} {inspection.vehicle.model}</h1>
              <p className="text-sm text-muted-foreground font-mono">{inspection.vehicle.registration_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={RESULT_CLS[inspection.result]}>{RESULT_FR[inspection.result]}</Badge>
            {inspection.is_expired && <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Expirée</Badge>}
            <Button size="sm" asChild>
              <Link href={`/technical-inspections/${inspectionId}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" />Modifier</Link>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Date de visite', fdate(inspection.inspection_date)],
                ["Date d'expiration", fdate(inspection.expiry_date)],
                ['Prochaine visite', fdate(inspection.next_inspection_date)],
                ['Centre de contrôle', inspection.inspection_center || '—'],
                ['Contrôleur', inspection.inspector_name || '—'],
                ['Coût', inspection.cost != null ? `${inspection.cost} MAD` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Commentaire</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inspection.observations || 'Aucun commentaire'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents</h2>
          <SingleDocUpload
            label="Rapport de contrôle (PDF)"
            fieldName="report"
            uploadUrl={apiRoutes.technicalInspections.uploadReport(inspectionId)}
            currentUrl={media.inspection_report?.[0]?.url}
            onUploaded={() => refetchMedia()}
          />
          <DocumentsSection
            title="Photos"
            entityId={inspectionId}
            uploadUrl={apiRoutes.technicalInspections.uploadPhotos(inspectionId)}
            deleteUrlFn={(mid) => apiRoutes.technicalInspections.deleteMedia(inspectionId, mid)}
            initialDocuments={media.photos ?? []}
            fieldName="photos"
            accept="image/*"
            onRefresh={() => refetchMedia()}
          />
          <DocumentsSection
            title="Autres documents"
            entityId={inspectionId}
            uploadUrl={apiRoutes.technicalInspections.uploadDocuments(inspectionId)}
            deleteUrlFn={(mid) => apiRoutes.technicalInspections.deleteMedia(inspectionId, mid)}
            initialDocuments={media.documents ?? []}
            onRefresh={() => refetchMedia()}
          />
        </div>
      </div>
    </PageContainer>
  );
}
