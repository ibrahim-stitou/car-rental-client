'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react';
import { useInsurance, useDeleteInsurance } from '../hooks/use-insurances';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SingleDocUpload } from '@/components/shared/single-doc-upload';
import { DocumentsSection } from '@/components/shared/documents-section';
import PageContainer from '@/components/layout/page-container';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

interface Props { insuranceId: string }

function fdate(d?: string) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

export function InsuranceDetailView({ insuranceId }: Props) {
  const { data: res, isLoading } = useInsurance(insuranceId);
  const insurance = res?.data;

  const { data: mediaRes, refetch: refetchMedia } = useQuery({
    queryKey: ['insurances', insuranceId, 'media'],
    queryFn: () => apiClient.get(apiRoutes.insurances.media(insuranceId)).then((r) => r.data),
    enabled: !!insuranceId,
  });
  const media = mediaRes?.data ?? {};

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></PageContainer>;
  }

  if (!insurance) {
    return <PageContainer><div className="p-6 text-muted-foreground">Assurance introuvable.</div></PageContainer>;
  }

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full ">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/insurances"><ArrowLeft className="h-4 w-4 mr-1" />Assurances</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{insurance.insurance_company}</h1>
              <p className="text-sm text-muted-foreground font-mono">{insurance.policy_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {insurance.is_expired ? (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Expirée</Badge>
            ) : insurance.days_until_expiry !== null && insurance.days_until_expiry <= 30 ? (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Expire bientôt</Badge>
            ) : (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Active</Badge>
            )}
            <Button size="sm" asChild>
              <Link href={`/insurances/${insuranceId}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" />Modifier</Link>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Véhicule', `${insurance.vehicle.brand} ${insurance.vehicle.model} — ${insurance.vehicle.registration_number}`],
                ['Type', insurance.type?.replace(/_/g, ' ')],
                ['Date de début', fdate(insurance.start_date)],
                ['Date de fin', fdate(insurance.end_date)],
                ['Agent', insurance.agent_name || '—'],
                ['Téléphone agent', insurance.agent_phone || '—'],
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
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insurance.notes || 'Aucun commentaire'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents</h2>
          <SingleDocUpload
            label="Police d'assurance (PDF)"
            fieldName="policy_document"
            uploadUrl={apiRoutes.insurances.uploadPolicyDocument(insuranceId)}
            currentUrl={media.policy_document?.[0]?.url}
            onUploaded={() => refetchMedia()}
          />
          <SingleDocUpload
            label="Carte verte"
            fieldName="green_card"
            uploadUrl={apiRoutes.insurances.uploadGreenCard(insuranceId)}
            currentUrl={media.green_card?.[0]?.url}
            accept="image/*,application/pdf"
            onUploaded={() => refetchMedia()}
          />
          <DocumentsSection
            title="Autres documents"
            entityId={insuranceId}
            uploadUrl={apiRoutes.insurances.uploadDocuments(insuranceId)}
            deleteUrlFn={(mid) => apiRoutes.insurances.deleteMedia(insuranceId, mid)}
            initialDocuments={media.documents ?? []}
            onRefresh={() => refetchMedia()}
          />
        </div>
      </div>
    </PageContainer>
  );
}
