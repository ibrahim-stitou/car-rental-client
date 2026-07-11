'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { TechnicalInspection } from '@/types/technical-inspection.types';
import { INSPECTION_RESULT_OPTIONS } from '@/config/constants';

const RESULT_CLS: Record<string, string> = {
  passed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
};
const RESULT_FR: Record<string, string> = { passed: 'Réussi', failed: 'Échoué', pending: 'En attente' };

export function TechnicalInspectionsView() {
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<TechnicalInspection>> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const columns: CustomTableColumn<TechnicalInspection>[] = [
    { data: 'vehicle', label: 'Véhicule', sortable: false, render: (_v, row) => <div><div className="font-medium text-sm">{row.vehicle.brand} {row.vehicle.model}</div><div className="text-xs text-muted-foreground font-mono">{row.vehicle.registration_number}</div></div> },
    { data: 'inspection_date', label: 'Date visite', sortable: true, render: (v) => <span className="text-sm">{v}</span> },
    { data: 'expiry_date', label: 'Expiration', sortable: true, render: (v) => <span className="text-sm">{v}</span> },
    { data: 'result', label: 'Résultat', sortable: true, render: (v) => <Badge variant="outline" className={`text-xs ${RESULT_CLS[v] ?? ''}`}>{RESULT_FR[v] ?? v}</Badge> },
    { data: 'inspection_center', label: 'Centre', sortable: false, render: (v) => <span className="text-sm">{v ?? '—'}</span> },
    {
      data: 'is_expired', label: 'Validité', sortable: false,
      render: (_v, row) => row.is_expired
        ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-xs">Expirée</Badge>
        : row.days_until_expiry !== null && (row.days_until_expiry ?? 999) <= 30
        ? <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Expire bientôt</Badge>
        : <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">Valide</Badge>,
    },
    {
      data: 'actions', label: 'Actions', sortable: false,
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => router.push(`/technical-inspections/${row.id}`)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Voir</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => router.push(`/technical-inspections/${row.id}/edit`)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Modifier</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
        </div>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'result', label: 'Résultat', type: 'select', options: INSPECTION_RESULT_OPTIONS },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.technicalInspections.delete(deleteId));
      toast.success('Visite technique supprimée');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer la visite'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Visites techniques" description="Suivi des visites techniques de la flotte"
        actions={<Button size="sm" onClick={() => router.push('/technical-inspections/new')}><Plus className="h-4 w-4 mr-1.5" />Ajouter une visite</Button>} />
      <CustomTable<TechnicalInspection> url={apiRoutes.technicalInspections.list} columns={columns} filters={filters} onInit={(i) => setTableInstance(i)} />
      <CustomAlertDialog title="Supprimer la visite technique ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
    </div>
  );
}
