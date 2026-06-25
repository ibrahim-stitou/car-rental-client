'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Client } from '@/types/client.types';

const ID_TYPE_LABELS: Record<string, string> = {
  cin: 'CIN',
  passport: 'Passeport',
  residence_permit: 'Titre de séjour',
};

export function ClientsView() {
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Client>> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const columns: CustomTableColumn<Client>[] = [
    {
      data: 'first_name',
      label: 'Nom',
      sortable: true,
      render: (_value, row) => (
        <div>
          <div className="font-medium text-sm">{row.first_name} {row.last_name}</div>
          {row.email && <div className="text-xs text-muted-foreground">{row.email}</div>}
        </div>
      ),
    },
    { data: 'phone', label: 'Téléphone', sortable: false, render: (v) => <span className="font-mono text-sm">{v}</span> },
    { data: 'agency', label: 'Agence', sortable: false, render: (_v, row) => <span className="text-sm">{row.agency?.name ?? '—'}</span> },
    {
      data: 'id_type',
      label: 'Pièce d\'identité',
      sortable: false,
      render: (v) => v
        ? <Badge variant="outline" className="text-xs">{ID_TYPE_LABELS[v as string] ?? v}</Badge>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      data: 'is_blacklisted',
      label: 'Statut',
      sortable: true,
      render: (v) => v
        ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-xs">Blacklisté</Badge>
        : <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">Actif</Badge>,
    },
    { data: 'reservations_count', label: 'Réservations', sortable: false, render: (v) => <span className="text-sm">{v ?? 0}</span> },
    {
      data: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5" asChild>
                <Link href={`/clients/${row.id}`}><Eye className="h-4 w-4" /></Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Détails</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5" asChild>
                <Link href={`/clients/${row.id}/edit`}><Edit className="h-4 w-4" /></Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Modifier</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}>
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
    { field: 'search', label: 'Rechercher un client…', type: 'text' },
    {
      field: 'is_blacklisted',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'false', label: 'Actif' },
        { value: 'true', label: 'Blacklisté' },
      ],
    },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.clients.delete(deleteId));
      toast.success('Client supprimé');
      tableInstance?.refresh?.();
    } catch {
      toast.error('Impossible de supprimer le client');
    }
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Clients"
        description="Gestion de la base de données clients"
        onAdd={() => router.push('/clients/new')}
        addLabel="Ajouter un client"
      />

      <CustomTable<Client>
        url={apiRoutes.clients.list}
        columns={columns}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />

      <CustomAlertDialog
        title="Supprimer le client ?"
        description="Cette action est irréversible. Le client sera définitivement supprimé."
        confirmText="Supprimer"
        cancelText="Annuler"
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
