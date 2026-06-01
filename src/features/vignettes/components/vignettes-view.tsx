'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { VignetteForm } from './vignette-form';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Vignette } from '@/types/vignette.types';

export function VignettesView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Vignette>> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editVignette, setEditVignette] = useState<Vignette | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const columns: CustomTableColumn<Vignette>[] = [
    { data: 'vehicle', label: 'Véhicule', sortable: false, render: (_v, row) => <div><div className="font-medium text-sm">{row.vehicle.brand} {row.vehicle.model}</div><div className="text-xs text-muted-foreground font-mono">{row.vehicle.registration_number}</div></div> },
    { data: 'year', label: 'Année', sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { data: 'issue_date', label: 'Date émission', sortable: true, render: (v) => <span className="text-sm">{v}</span> },
    { data: 'expiry_date', label: 'Expiration', sortable: true, render: (v) => <span className="text-sm">{v}</span> },
    { data: 'amount', label: 'Montant', sortable: true, render: (v) => <span className="font-medium">{Number(v).toLocaleString('fr-MA')} MAD</span> },
    {
      data: 'is_paid', label: 'Paiement', sortable: true,
      render: (v) => v
        ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">Payée</Badge>
        : <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Non payée</Badge>,
    },
    {
      data: 'actions', label: 'Actions', sortable: false,
      render: (_v, row, refresh) => (
        <div className="flex items-center gap-1">
          {!row.is_paid && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-1.5 text-green-600 hover:bg-green-50" onClick={async () => {
                  try { await apiClient.post(apiRoutes.vignettes.markPaid(row.id), { payment_method: 'cash' }); toast.success('Vignette marquée comme payée'); refresh(); }
                  catch { toast.error('Échec de l\'opération'); }
                }}><DollarSign className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Marquer comme payée</TooltipContent>
            </Tooltip>
          )}
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => { setEditVignette(row); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Modifier</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
        </div>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'is_paid', label: 'Paiement', type: 'select', options: [{ value: 'true', label: 'Payée' }, { value: 'false', label: 'Non payée' }] },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.vignettes.delete(deleteId));
      toast.success('Vignette supprimée');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer la vignette'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Vignettes" description="Suivi des vignettes automobiles" onAdd={() => { setEditVignette(null); setFormOpen(true); }} addLabel="Ajouter une vignette" />
      <CustomTable<Vignette> url={apiRoutes.vignettes.list} columns={columns} filters={filters} onInit={(i) => setTableInstance(i)} />
      <VignetteForm open={formOpen} onOpenChange={setFormOpen} vignette={editVignette} onSuccess={() => tableInstance?.refresh?.()} />
      <CustomAlertDialog title="Supprimer la vignette ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
    </div>
  );
}
