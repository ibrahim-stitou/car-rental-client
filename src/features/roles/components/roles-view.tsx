'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, UseTableReturn } from '@/components/custom/data-table/types';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import { Badge } from '@/components/ui/badge';
import { useDeleteRole } from '../hooks/use-roles';
import type { Role } from '@/types/role.types';

const ROLE_FR: Record<string, string> = {
  'super-admin': 'Super Administrateur', admin: 'Administrateur', manager: 'Gestionnaire', agent: 'Agent', viewer: 'Observateur',
};
const SYSTEM_ROLES = ['super-admin', 'admin'];

export function RolesView() {
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Role>> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const deleteMutation = useDeleteRole();

  const columns: CustomTableColumn<Role>[] = [
    { data: 'name', label: 'Rôle', sortable: true, render: (v) => <span className="font-medium">{ROLE_FR[v as string] ?? v}</span> },
    { data: 'permissions_count', label: 'Permissions', sortable: false, render: (v) => <Badge variant="outline" className="text-xs">{v ?? 0}</Badge> },
    { data: 'users_count', label: 'Utilisateurs', sortable: false, render: (v) => <span className="text-sm">{v ?? 0}</span> },
    { data: 'created_at', label: 'Créé le', sortable: true, render: (v) => <span className="text-sm text-muted-foreground">{new Date(v).toLocaleDateString('fr-MA')}</span> },
    {
      data: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => router.push(`/roles/${row.id}`)}>
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger><TooltipContent>Voir / Modifier</TooltipContent></Tooltip>
          {!SYSTEM_ROLES.includes(row.name) && (
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50"
                onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
          )}
        </div>
      ),
    },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Rôle supprimé');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer ce rôle'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Rôles et permissions"
        description="Gestion dynamique des rôles et de leurs permissions"
        onAdd={() => router.push('/roles/new')}
        addLabel="Nouveau rôle"
      />
      <CustomTable<Role> url={apiRoutes.roles.list} columns={columns} filters={[]} onInit={(i) => setTableInstance(i)} />
      <CustomAlertDialog title="Supprimer ce rôle ?" description="Cette action est irréversible. Les utilisateurs ayant ce rôle le perdront." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
    </div>
  );
}
