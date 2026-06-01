'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { InsuranceForm } from './insurance-form';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Insurance } from '@/types/insurance.types';
import { INSURANCE_TYPE_OPTIONS } from '@/config/constants';

export function InsurancesView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Insurance>> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editInsurance, setEditInsurance] = useState<Insurance | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const columns: CustomTableColumn<Insurance>[] = [
    { data: 'vehicle', label: 'Véhicule', sortable: false, render: (_v, row) => <div><div className="font-medium text-sm">{row.vehicle.brand} {row.vehicle.model}</div><div className="text-xs text-muted-foreground font-mono">{row.vehicle.registration_number}</div></div> },
    { data: 'insurance_company', label: 'Compagnie', sortable: true, render: (v) => <span className="text-sm font-medium">{v}</span> },
    { data: 'policy_number', label: 'N° Police', sortable: true, render: (v) => <span className="font-mono text-sm">{v}</span> },
    { data: 'type', label: 'Type', sortable: true, render: (v) => <Badge variant="outline" className="text-xs capitalize">{v?.replace(/_/g, ' ')}</Badge> },
    { data: 'end_date', label: 'Expiration', sortable: true, render: (v) => <span className="text-sm">{v}</span> },
    { data: 'premium_amount', label: 'Prime', sortable: true, render: (v) => <span className="font-medium">{Number(v).toLocaleString('fr-MA')} MAD</span> },
    {
      data: 'is_expired', label: 'Statut', sortable: false,
      render: (_v, row) => row.is_expired
        ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-xs">Expirée</Badge>
        : row.days_until_expiry !== null && row.days_until_expiry <= 30
        ? <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Expire bientôt</Badge>
        : <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">Active</Badge>,
    },
    {
      data: 'actions', label: 'Actions', sortable: false,
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => { setEditInsurance(row); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Modifier</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
        </div>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'type', label: 'Type', type: 'select', options: INSURANCE_TYPE_OPTIONS },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.insurances.delete(deleteId));
      toast.success('Assurance supprimée');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer l\'assurance'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Assurances" description="Suivi des polices d'assurance véhicules" onAdd={() => { setEditInsurance(null); setFormOpen(true); }} addLabel="Ajouter une assurance" />
      <CustomTable<Insurance> url={apiRoutes.insurances.list} columns={columns} filters={filters} onInit={(i) => setTableInstance(i)} />
      <InsuranceForm open={formOpen} onOpenChange={setFormOpen} insurance={editInsurance} onSuccess={() => tableInstance?.refresh?.()} />
      <CustomAlertDialog title="Supprimer l'assurance ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
    </div>
  );
}
