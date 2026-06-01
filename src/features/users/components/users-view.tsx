'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { UserForm } from './user-form';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { User } from '@/types/user.types';

const ROLE_FR: Record<string, string> = {
  'super-admin': 'Super Admin', admin: 'Administrateur', manager: 'Gestionnaire', agent: 'Agent', viewer: 'Observateur',
};

export function UsersView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<User>> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const doAction = async (url: string, msg: string) => {
    try { await apiClient.post(url); toast.success(msg); tableInstance?.refresh?.(); }
    catch { toast.error('Action impossible'); }
  };

  const columns: CustomTableColumn<User>[] = [
    {
      data: 'first_name', label: 'Utilisateur', sortable: true,
      render: (_v, row) => {
        const initials = `${row.first_name[0]}${row.last_name[0]}`.toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{row.first_name} {row.last_name}</div>
              <div className="text-xs text-muted-foreground">{row.email}</div>
            </div>
          </div>
        );
      },
    },
    { data: 'phone', label: 'Téléphone', sortable: false, render: (v) => <span className="font-mono text-sm">{v ?? '—'}</span> },
    {
      data: 'roles', label: 'Rôles', sortable: false,
      render: (v) => (
        <div className="flex flex-wrap gap-1">
          {(v as string[] ?? []).map((r: string) => (
            <Badge key={r} variant="outline" className="text-xs">{ROLE_FR[r] ?? r}</Badge>
          ))}
        </div>
      ),
    },
    { data: 'agency', label: 'Agence', sortable: false, render: (_v, row) => <span className="text-sm">{row.agency?.name ?? '—'}</span> },
    {
      data: 'is_active', label: 'Statut', sortable: true,
      render: (v) => <Badge variant="outline" className={v ? 'bg-green-100 text-green-800 border-green-200 text-xs' : 'bg-red-100 text-red-800 border-red-200 text-xs'}>{v ? 'Actif' : 'Suspendu'}</Badge>,
    },
    {
      data: 'actions', label: 'Actions', sortable: false,
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => { setEditUser(row); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Modifier</TooltipContent></Tooltip>
          {row.is_active
            ? <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5 text-amber-600 hover:bg-amber-50" onClick={() => doAction(apiRoutes.users.suspend(row.id), 'Utilisateur suspendu')}><UserX className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Suspendre</TooltipContent></Tooltip>
            : <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5 text-green-600 hover:bg-green-50" onClick={() => doAction(apiRoutes.users.activate(row.id), 'Utilisateur activé')}><UserCheck className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Activer</TooltipContent></Tooltip>
          }
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
        </div>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'search', label: 'Rechercher un utilisateur…', type: 'text' },
    { field: 'is_active', label: 'Statut', type: 'select', options: [{ value: 'true', label: 'Actif' }, { value: 'false', label: 'Suspendu' }] },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.users.delete(deleteId));
      toast.success('Utilisateur supprimé');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer l\'utilisateur'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Utilisateurs" description="Gestion des utilisateurs du système" onAdd={() => { setEditUser(null); setFormOpen(true); }} addLabel="Ajouter un utilisateur" />
      <CustomTable<User> url={apiRoutes.users.list} columns={columns} filters={filters} onInit={(i) => setTableInstance(i)} />
      <UserForm open={formOpen} onOpenChange={setFormOpen} user={editUser} onSuccess={() => tableInstance?.refresh?.()} />
      <CustomAlertDialog title="Supprimer l'utilisateur ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
    </div>
  );
}
