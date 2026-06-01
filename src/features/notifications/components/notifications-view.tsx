'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Notification } from '@/types/notification.types';

const SEV_CLS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};
const SEV_FR: Record<string, string> = { info: 'Info', warning: 'Avertissement', critical: 'Critique' };

export function NotificationsView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Notification>> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const markAllRead = async () => {
    try { await apiClient.post(apiRoutes.notifications.markAllRead); toast.success('Toutes les notifications marquées comme lues'); tableInstance?.refresh?.(); }
    catch { toast.error('Échec de l\'opération'); }
  };

  const columns: CustomTableColumn<Notification>[] = [
    { data: 'is_read', label: '', sortable: false, render: (v) => v ? null : <div className="h-2 w-2 rounded-full bg-blue-500" /> },
    { data: 'severity', label: 'Sévérité', sortable: true, render: (v) => <Badge variant="outline" className={`text-xs ${SEV_CLS[v] ?? ''}`}>{SEV_FR[v] ?? v}</Badge> },
    { data: 'title', label: 'Titre', sortable: true, render: (v, row) => <span className={`text-sm ${!row.is_read ? 'font-semibold' : ''}`}>{v}</span> },
    { data: 'body', label: 'Message', sortable: false, render: (v) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{v}</span> },
    { data: 'created_at', label: 'Date', sortable: true, render: (v) => <span className="text-xs text-muted-foreground">{new Date(v).toLocaleString('fr-MA')}</span> },
    {
      data: 'actions', label: 'Actions', sortable: false,
      render: (_v, row, refresh) => (
        <div className="flex items-center gap-1">
          {!row.is_read && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-1.5 text-blue-600 hover:bg-blue-50" onClick={async () => {
                  try { await apiClient.post(apiRoutes.notifications.markRead(row.id)); toast.success('Notification lue'); refresh(); }
                  catch { toast.error('Échec'); }
                }}><Check className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Marquer comme lue</TooltipContent>
            </Tooltip>
          )}
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
        </div>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'severity', label: 'Sévérité', type: 'select', options: [{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Avertissement' }, { value: 'critical', label: 'Critique' }] },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try { await apiClient.delete(apiRoutes.notifications.delete(deleteId)); toast.success('Notification supprimée'); tableInstance?.refresh?.(); }
    catch { toast.error('Impossible de supprimer'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Notifications"
        description="Gestion des notifications système"
        actions={
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" /> Tout marquer comme lu
          </Button>
        }
      />
      <CustomTable<Notification> url={apiRoutes.notifications.list} columns={columns} filters={filters} onInit={(i) => setTableInstance(i)} />
      <CustomAlertDialog title="Supprimer la notification ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
    </div>
  );
}
