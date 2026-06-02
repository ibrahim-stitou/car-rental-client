'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { ClaimForm } from './claim-form';
import { ClaimDetailDialog } from './claim-detail-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Claim } from '@/types/claim.types';
import { CLAIM_STATUS_OPTIONS, ACCIDENT_TYPE_OPTIONS } from '@/config/constants';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useClaimStatistics } from '../hooks/use-claims';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAlertTriangle, IconShield, IconCurrencyDirham } from '@tabler/icons-react';

function fmt(n: number | undefined) { return (n ?? 0).toLocaleString('fr-MA'); }

export function ClaimsView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Claim>> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editClaim, setEditClaim] = useState<Claim | null>(null);
  const [detailClaim, setDetailClaim] = useState<Claim | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const { data: statsRes } = useClaimStatistics();
  const stats = statsRes?.data;

  const columns: CustomTableColumn<Claim>[] = [
    {
      data: 'claim_number',
      label: 'N° Sinistre',
      sortable: true,
      render: (v) => <span className="font-mono text-sm font-semibold">{v}</span>,
    },
    {
      data: 'vehicle',
      label: 'Véhicule',
      sortable: false,
      render: (_, row) => (
        <div>
          <div className="text-sm font-medium">{(row as any).vehicle?.brand} {(row as any).vehicle?.model}</div>
          <div className="text-xs text-muted-foreground font-mono">{(row as any).vehicle?.registration_number}</div>
        </div>
      ),
    },
    {
      data: 'client',
      label: 'Client',
      sortable: false,
      render: (_, row) => {
        const c = (row as any).client;
        return c ? (
          <div>
            <div className="text-sm">{c.full_name}</div>
            <div className="text-xs text-muted-foreground">{c.phone}</div>
          </div>
        ) : <span className="text-xs text-muted-foreground italic">Équipe</span>;
      },
    },
    {
      data: 'claim_date',
      label: 'Date',
      sortable: true,
      render: (v) => v ? format(parseISO(v as string), 'dd MMM yyyy', { locale: fr }) : '—',
    },
    {
      data: 'accident_type',
      label: 'Type',
      sortable: true,
      render: (v) => {
        const opt = ACCIDENT_TYPE_OPTIONS.find(o => o.value === v);
        return <Badge variant="outline" className="text-xs">{opt?.label ?? v}</Badge>;
      },
    },
    {
      data: 'is_client_responsible',
      label: 'Responsable',
      sortable: true,
      render: (v) => (
        <Badge variant="outline" className={`text-xs ${v ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
          {v ? 'Client' : 'Équipe/Autre'}
        </Badge>
      ),
    },
    {
      data: 'status',
      label: 'Statut',
      sortable: true,
      render: (v) => {
        const opt = CLAIM_STATUS_OPTIONS.find(o => o.value === v);
        return <Badge className={`text-xs ${opt?.color ?? ''}`}>{opt?.label ?? v}</Badge>;
      },
    },
    {
      data: 'total_damage_amount',
      label: 'Dégâts',
      sortable: true,
      render: (v) => <span className="font-semibold text-sm text-red-600">{fmt(Number(v))} MAD</span>,
    },
    {
      data: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => setDetailClaim(row)}>
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger><TooltipContent>Détails</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => { setEditClaim(row); setFormOpen(true); }}>
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger><TooltipContent>Modifier</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50"
              onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
        </div>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'search', label: 'Rechercher…', type: 'text' },
    { field: 'status', label: 'Statut', type: 'select', options: CLAIM_STATUS_OPTIONS },
    { field: 'accident_type', label: 'Type', type: 'select', options: ACCIDENT_TYPE_OPTIONS },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.claims.delete(deleteId));
      toast.success('Sinistre supprimé');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Sinistres"
        description="Gestion des accidents et sinistres véhicules"
        onAdd={() => { setEditClaim(null); setFormOpen(true); }}
        addLabel="Déclarer un sinistre"
      />

      {/* Stats KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total sinistres', value: stats.total, icon: IconAlertTriangle, color: 'bg-orange-500' },
            { label: 'En cours', value: stats.open, icon: IconAlertTriangle, color: 'bg-red-500' },
            { label: 'Dégâts totaux', value: `${fmt(stats.total_damage)} MAD`, icon: IconCurrencyDirham, color: 'bg-red-600' },
            { label: 'Récupéré assurance', value: `${fmt(stats.total_insurance_recovered)} MAD`, icon: IconShield, color: 'bg-green-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                <div className={`p-1.5 rounded-lg ${color}`}><Icon className="h-4 w-4 text-white" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomTable<Claim> url={apiRoutes.claims.list} columns={columns} filters={filters} onInit={(i) => setTableInstance(i)} />
      <ClaimForm open={formOpen} onOpenChange={setFormOpen} claim={editClaim} onSuccess={() => tableInstance?.refresh?.()} />
      <CustomAlertDialog title="Supprimer le sinistre ?" description="Action irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
      {detailClaim && (
        <ClaimDetailDialog
          open={!!detailClaim}
          onOpenChange={(o) => !o && setDetailClaim(null)}
          claim={detailClaim}
          onEdit={(c) => { setDetailClaim(null); setEditClaim(c); setFormOpen(true); }}
        />
      )}
    </div>
  );
}
