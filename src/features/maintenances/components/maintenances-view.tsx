'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { MaintenanceForm } from './maintenance-form';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Maintenance } from '@/types/maintenance.types';
import { MAINTENANCE_STATUS_OPTIONS, MAINTENANCE_PRIORITY_OPTIONS, MAINTENANCE_TYPE_OPTIONS } from '@/config/constants';

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

export function MaintenancesView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Maintenance>> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editMaintenance, setEditMaintenance] = useState<Maintenance | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const doAction = async (id: string, url: string, msg: string) => {
    setPendingAction(id);
    try {
      await apiClient.patch(url);
      toast.success(msg);
      tableInstance?.refresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Action impossible');
    } finally {
      setPendingAction(null);
    }
  };

  const columns: CustomTableColumn<Maintenance>[] = [
    {
      data: 'vehicle',
      label: 'Véhicule',
      sortable: false,
      render: (_v, row) => (
        <div>
          <div className="font-medium text-sm">{row.vehicle.brand} {row.vehicle.model}</div>
          <div className="text-xs text-muted-foreground font-mono">{row.vehicle.registration_number}</div>
        </div>
      ),
    },
    {
      data: 'type',
      label: 'Type',
      sortable: true,
      render: (v) => <Badge variant="outline" className="text-xs capitalize">{(v as string)?.replace(/_/g, ' ')}</Badge>,
    },
    {
      data: 'maintenance_date',
      label: 'Date',
      sortable: true,
      render: (v, row) => (
        <div>
          <div className="text-sm">{v as string}</div>
          {row.cost > 0 && <div className="text-xs text-muted-foreground">{Number(row.cost).toLocaleString('fr-MA')} MAD</div>}
        </div>
      ),
    },
    { data: 'status',   label: 'Statut',   sortable: true, render: (v) => <Badge variant="outline" className={`text-xs ${STATUS_CLS[v as string] ?? ''}`}>{STATUS_FR[v as string] ?? v}</Badge> },
    { data: 'priority', label: 'Priorité', sortable: true, render: (v) => <Badge variant="outline" className={`text-xs ${PRIORITY_CLS[v as string] ?? ''}`}>{PRIORITY_FR[v as string] ?? v}</Badge> },
    {
      data: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          {/* Terminer (scheduled / in_progress) */}
          {['scheduled', 'in_progress'].includes(row.status) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-1.5 text-green-600 hover:bg-green-50"
                  disabled={pendingAction === row.id}
                  onClick={() => doAction(row.id, apiRoutes.maintenancesExt.complete(row.id), 'Maintenance terminée')}>
                  {pendingAction === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Marquer terminée</TooltipContent>
            </Tooltip>
          )}
          {/* Annuler (scheduled / in_progress) */}
          {['scheduled', 'in_progress'].includes(row.status) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-1.5 text-orange-600 hover:bg-orange-50"
                  disabled={pendingAction === row.id}
                  onClick={() => doAction(row.id, apiRoutes.maintenancesExt.cancel(row.id), 'Maintenance annulée')}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Annuler</TooltipContent>
            </Tooltip>
          )}
          {/* Modifier */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5"
                onClick={() => { setEditMaintenance(row); setFormOpen(true); }}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Modifier</TooltipContent>
          </Tooltip>
          {/* Supprimer */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50"
                onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Supprimer</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'search', label: 'Rechercher une maintenance…', type: 'text' },
    { field: 'status',   label: 'Statut',   type: 'select', options: MAINTENANCE_STATUS_OPTIONS },
    { field: 'priority', label: 'Priorité', type: 'select', options: MAINTENANCE_PRIORITY_OPTIONS },
    { field: 'type',     label: 'Type',     type: 'select', options: MAINTENANCE_TYPE_OPTIONS },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.maintenances.delete(deleteId));
      toast.success('Maintenance supprimée');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer la maintenance'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Maintenances"
        description="Suivi des maintenances et réparations de la flotte"
        onAdd={() => { setEditMaintenance(null); setFormOpen(true); }}
        addLabel="Ajouter une maintenance"
      />
      <CustomTable<Maintenance>
        url={apiRoutes.maintenances.list}
        columns={columns}
        filters={filters}
        onInit={(i) => setTableInstance(i)}
      />
      <MaintenanceForm open={formOpen} onOpenChange={setFormOpen} maintenance={editMaintenance} onSuccess={() => tableInstance?.refresh?.()} />
      <CustomAlertDialog title="Supprimer la maintenance ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
    </div>
  );
}
