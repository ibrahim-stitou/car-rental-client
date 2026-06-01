'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2, DollarSign, CheckCircle, FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { BillingForm } from './billing-form';
import { MarkPaidDialog } from './mark-paid-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { BillingDocument } from '@/types/billing.types';
import { BILLING_TYPE_OPTIONS, BILLING_STATUS_OPTIONS } from '@/config/constants';
import { useApproveBillingDocument } from '../hooks/use-billing';
import { billingService } from '@/services/billing.service';

const STATUS_CLS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};
const STATUS_FR: Record<string, string> = { draft: 'Brouillon', pending: 'En attente', approved: 'Approuvé', paid: 'Payé', cancelled: 'Annulé' };
const TYPE_COLOR: Record<string, string> = {
  FA: 'bg-emerald-100 text-emerald-800', DV: 'bg-blue-100 text-blue-800',
  BC: 'bg-violet-100 text-violet-800', BR: 'bg-orange-100 text-orange-800',
  BL: 'bg-cyan-100 text-cyan-800', AV: 'bg-rose-100 text-rose-800',
};

export function BillingView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<BillingDocument>> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<BillingDocument | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [markPaidDoc, setMarkPaidDoc] = useState<BillingDocument | null>(null);
  const approveMutation = useApproveBillingDocument();

  const handleApprove = async (id: string, refresh: () => void) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Document approuvé');
      refresh();
    } catch {
      toast.error('Échec de l\'approbation');
    }
  };

  const columns: CustomTableColumn<BillingDocument>[] = [
    {
      data: 'reference',
      label: 'Référence',
      sortable: true,
      render: (v, row) => (
        <div>
          <div className="font-mono text-sm font-semibold">{v}</div>
          {row.reservation && <div className="text-xs text-muted-foreground">Rés. {(row.reservation as any)?.reservation_number}</div>}
        </div>
      ),
    },
    {
      data: 'type',
      label: 'Type',
      sortable: true,
      render: (v) => <Badge variant="outline" className={`text-xs font-semibold font-mono ${TYPE_COLOR[v as string] ?? ''}`}>{v}</Badge>,
    },
    {
      data: 'client_name',
      label: 'Client',
      sortable: true,
      render: (v, row) => (
        <div>
          <div className="text-sm font-medium">{v}</div>
          {row.client_phone && <div className="text-xs text-muted-foreground">{row.client_phone}</div>}
        </div>
      ),
    },
    { data: 'issue_date', label: 'Date', sortable: true, render: (v) => <span className="text-sm">{v}</span> },
    {
      data: 'total_amount',
      label: 'Total',
      sortable: true,
      render: (v, row) => (
        <div>
          <div className="font-semibold text-sm">{Number(v).toLocaleString('fr-MA')} MAD</div>
          {Number(row.balance) > 0 && <div className="text-xs text-red-600">Solde: {Number(row.balance).toLocaleString('fr-MA')}</div>}
        </div>
      ),
    },
    { data: 'status', label: 'Statut', sortable: true, render: (v) => <Badge variant="outline" className={`text-xs ${STATUS_CLS[v as string] ?? ''}`}>{STATUS_FR[v as string] ?? v}</Badge> },
    {
      data: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_v, row, refresh) => (
        <div className="flex items-center gap-1 flex-wrap">
          {/* Approve: draft or pending */}
          {['draft', 'pending'].includes(row.status) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-1.5 text-blue-600 hover:bg-blue-50"
                  onClick={() => handleApprove(row.id, refresh)}
                  disabled={approveMutation.isPending}>
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Approuver</TooltipContent>
            </Tooltip>
          )}
          {/* Mark paid: approved or pending */}
          {['approved', 'pending'].includes(row.status) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-1.5 text-green-600 hover:bg-green-50"
                  onClick={() => setMarkPaidDoc(row)}>
                  <DollarSign className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Marquer comme payé</TooltipContent>
            </Tooltip>
          )}
          {/* View PDF */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5 text-slate-600 hover:bg-slate-50"
                onClick={() => window.open(billingService.viewPdf(row.id), '_blank')}>
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voir PDF</TooltipContent>
          </Tooltip>
          {/* Download PDF */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5 text-slate-600 hover:bg-slate-50"
                onClick={() => window.open(billingService.downloadPdf(row.id), '_blank')}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Télécharger PDF</TooltipContent>
          </Tooltip>
          {/* Edit */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5"
                onClick={() => { setEditDoc(row); setFormOpen(true); }}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Modifier</TooltipContent>
          </Tooltip>
          {/* Delete */}
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
    { field: 'search', label: 'Rechercher un document…', type: 'text' },
    { field: 'type', label: 'Type', type: 'select', options: BILLING_TYPE_OPTIONS },
    { field: 'status', label: 'Statut', type: 'select', options: BILLING_STATUS_OPTIONS },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.billing.delete(deleteId));
      toast.success('Document supprimé');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer le document'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Facturation"
        description="Documents de facturation : factures, devis, bons de commande, avoirs"
        onAdd={() => { setEditDoc(null); setFormOpen(true); }}
        addLabel="Nouveau document"
      />
      <CustomTable<BillingDocument>
        url={apiRoutes.billing.list}
        columns={columns}
        filters={filters}
        onInit={(i) => setTableInstance(i)}
      />
      <BillingForm open={formOpen} onOpenChange={setFormOpen} document={editDoc} onSuccess={() => tableInstance?.refresh?.()} />
      <CustomAlertDialog title="Supprimer le document ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
      {markPaidDoc && (
        <MarkPaidDialog
          open={!!markPaidDoc}
          onOpenChange={(o) => !o && setMarkPaidDoc(null)}
          document={markPaidDoc}
          onSuccess={() => { tableInstance?.refresh?.(); setMarkPaidDoc(null); }}
        />
      )}
    </div>
  );
}
