'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useMaintenance } from '../hooks/use-maintenances';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentsSection } from '@/components/shared/documents-section';
import PageContainer from '@/components/layout/page-container';
import { apiRoutes } from '@/config/apiRoutes';

interface Props { maintenanceId: string }

const STATUS_CLS: Record<string, string> = {
  scheduled:   'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  completed:   'bg-green-100 text-green-800 border-green-200',
  cancelled:   'bg-red-100 text-red-800 border-red-200',
};
const STATUS_FR: Record<string, string> = { scheduled: 'Planifiée', in_progress: 'En cours', completed: 'Terminée', cancelled: 'Annulée' };
const PRIORITY_CLS: Record<string, string> = {
  low:    'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high:   'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};
const PRIORITY_FR: Record<string, string> = { low: 'Faible', medium: 'Moyenne', high: 'Élevée', urgent: 'Urgente' };

function fdate(d?: string | null) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}
function fmt(n?: number | null) {
  return n != null ? Number(n).toLocaleString('fr-MA') : '—';
}

export function MaintenanceDetailView({ maintenanceId }: Props) {
  const { data: res, isLoading, refetch } = useMaintenance(maintenanceId);
  const m = res?.data;

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></PageContainer>;
  }
  if (!m) {
    return <PageContainer><div className="p-6 text-muted-foreground">Maintenance introuvable.</div></PageContainer>;
  }

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full max-w-4xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/maintenances"><ArrowLeft className="h-4 w-4 mr-1" />Maintenances</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{m.title || `${m.vehicle.brand} ${m.vehicle.model}`}</h1>
              <p className="text-sm text-muted-foreground font-mono">{m.vehicle.registration_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={PRIORITY_CLS[m.priority]}>{PRIORITY_FR[m.priority]}</Badge>
            <Badge variant="outline" className={STATUS_CLS[m.status]}>{STATUS_FR[m.status]}</Badge>
            <Button size="sm" asChild>
              <Link href={`/maintenances/${maintenanceId}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" />Modifier</Link>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Type', m.type?.replace(/_/g, ' ')],
                ['Sous-type', m.sub_type?.replace(/_/g, ' ') || '—'],
                ['Date', fdate(m.maintenance_date)],
                ['Prochaine révision', fdate(m.next_service_date)],
                ['Km à l\'intervention', m.mileage_at_service != null ? `${fmt(m.mileage_at_service)} km` : '—'],
                ['Km prochaine révision', m.next_service_mileage != null ? `${fmt(m.next_service_mileage)} km` : '—'],
                ...(m.sub_type === 'oil_change' ? [['Km prochaine vidange', m.next_oil_change_mileage != null ? `${fmt(m.next_oil_change_mileage)} km` : '—']] : []),
                ...(m.sub_type === 'tire_change' ? [['Position des pneus', m.tire_position || '—']] : []),
                ['Prestataire', m.service_provider || '—'],
                ['Coût estimé', `${fmt(m.cost)} MAD`],
                ['Coût réel', m.actual_cost != null ? `${fmt(m.actual_cost)} MAD` : '—'],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v as string}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{m.description}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Commentaire</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{m.agent_notes || 'Aucun commentaire'}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents</h2>
          <DocumentsSection
            title="Factures"
            entityId={maintenanceId}
            uploadUrl={apiRoutes.maintenancesExt.uploadInvoices(maintenanceId)}
            deleteUrlFn={(mid) => apiRoutes.maintenancesExt.deleteMedia(maintenanceId, mid)}
            initialDocuments={m.invoices ?? []}
            fieldName="invoices"
            accept="application/pdf"
            onRefresh={() => refetch()}
          />
          <DocumentsSection
            title="Photos avant intervention"
            entityId={maintenanceId}
            uploadUrl={apiRoutes.maintenancesExt.uploadPhotosBefore(maintenanceId)}
            deleteUrlFn={(mid) => apiRoutes.maintenancesExt.deleteMedia(maintenanceId, mid)}
            initialDocuments={m.photos_before ?? []}
            fieldName="photos"
            accept="image/*"
            onRefresh={() => refetch()}
          />
          <DocumentsSection
            title="Photos après intervention"
            entityId={maintenanceId}
            uploadUrl={apiRoutes.maintenancesExt.uploadPhotosAfter(maintenanceId)}
            deleteUrlFn={(mid) => apiRoutes.maintenancesExt.deleteMedia(maintenanceId, mid)}
            initialDocuments={m.photos_after ?? []}
            fieldName="photos"
            accept="image/*"
            onRefresh={() => refetch()}
          />
          <DocumentsSection
            title="Autres documents"
            entityId={maintenanceId}
            uploadUrl={apiRoutes.maintenancesExt.uploadDocuments(maintenanceId)}
            deleteUrlFn={(mid) => apiRoutes.maintenancesExt.deleteMedia(maintenanceId, mid)}
            initialDocuments={m.documents ?? []}
            onRefresh={() => refetch()}
          />
        </div>
      </div>
    </PageContainer>
  );
}
