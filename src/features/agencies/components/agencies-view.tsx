'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { AgencyForm } from './agency-form';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Agency } from '@/types/agency.types';
import { IconBuildingStore } from '@tabler/icons-react';

export function AgenciesView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Agency>> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editAgency, setEditAgency] = useState<Agency | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const columns: CustomTableColumn<Agency>[] = [
    {
      data: 'name', label: 'Agence', sortable: true,
      render: (_v, row) => (
        <div className="flex items-center gap-3">
          {row.logo_url
            ? <img src={row.logo_url} alt={row.name} className="h-8 w-8 rounded object-cover" />
            : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><IconBuildingStore className="h-4 w-4 text-muted-foreground" /></div>}
          <div>
            <div className="font-medium text-sm">{row.name}</div>
            <div className="text-xs text-muted-foreground">{row.city}</div>
          </div>
        </div>
      ),
    },
    { data: 'email', label: 'Email', sortable: true, render: (v) => <span className="text-sm">{v}</span> },
    { data: 'phone', label: 'Téléphone', sortable: false, render: (v) => <span className="font-mono text-sm">{v}</span> },
    { data: 'manager', label: 'Responsable', sortable: false, render: (_v, row) => row.manager ? <span className="text-sm">{row.manager.first_name} {row.manager.last_name}</span> : <span className="text-muted-foreground text-sm">—</span> },
    { data: 'vehicles_count', label: 'Véhicules', sortable: false, render: (v) => <span className="text-sm">{v ?? 0}</span> },
    {
      data: 'is_active', label: 'Statut', sortable: true,
      render: (v) => <Badge variant="outline" className={v ? 'bg-green-100 text-green-800 border-green-200 text-xs' : 'bg-red-100 text-red-800 border-red-200 text-xs'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      data: 'actions', label: 'Actions', sortable: false,
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5" asChild><Link href={`/agencies/${row.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>Détails</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => { setEditAgency(row); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Modifier</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
        </div>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'search', label: 'Rechercher une agence…', type: 'text' },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.agencies.delete(deleteId));
      toast.success('Agence supprimée');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer l\'agence'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Agences" description="Gestion des agences de location" onAdd={() => { setEditAgency(null); setFormOpen(true); }} addLabel="Ajouter une agence" />
      <CustomTable<Agency> url={apiRoutes.agencies.list} columns={columns} filters={filters} onInit={(i) => setTableInstance(i)} />
      <AgencyForm open={formOpen} onOpenChange={setFormOpen} agency={editAgency} onSuccess={() => tableInstance?.refresh?.()} />
      <CustomAlertDialog title="Supprimer l'agence ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
    </div>
  );
}
