'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Edit, Trash2, DollarSign, CheckCircle, FileText, Download, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { MarkPaidDialog } from './mark-paid-dialog';
import { UnapproveDialog } from './unapprove-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { BillingDocument } from '@/types/billing.types';
import { BILLING_TYPE_OPTIONS, BILLING_STATUS_OPTIONS } from '@/config/constants';
import { useApproveBillingDocument } from '../hooks/use-billing';

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

async function fetchPdfBlob(url: string): Promise<string | null> {
  const toastId = toast.loading('Chargement du PDF…');
  try {
    const res = await apiClient.get<BlobPart>(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    toast.dismiss(toastId);
    return blobUrl;
  } catch {
    toast.dismiss(toastId);
    toast.error('Impossible de charger le PDF');
    return null;
  }
}

async function downloadPdfBlob(url: string, filename?: string) {
  const blobUrl = await fetchPdfBlob(url);
  if (!blobUrl) return;
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename ?? 'document.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}

export function BillingView() {
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<BillingDocument>> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [markPaidDoc, setMarkPaidDoc] = useState<BillingDocument | null>(null);
  const [unapproveDoc, setUnapproveDoc] = useState<BillingDocument | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
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

  const handleViewPdf = async (id: string) => {
    const url = await fetchPdfBlob(apiRoutes.billingExt.viewPdf(id));
    if (url) setPdfPreviewUrl(url);
  };

  const handleClosePdf = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  const columns: CustomTableColumn<BillingDocument>[] = [
    {
      data: 'reference',
      label: 'Référence',
      sortable: true,
      render: (v, row) => {
        const isTemp = String(v ?? '').startsWith('BROUILLON-');
        return (
          <div
            className="cursor-pointer group"
            onClick={() => router.push(`/billing/${row.id}`)}
          >
            {isTemp ? (
              <Badge variant="outline" className="text-xs border-dashed font-mono border-amber-300 text-amber-700 bg-amber-50 group-hover:bg-amber-100">
                Réf. en attente
              </Badge>
            ) : (
              <div className="font-mono text-sm font-semibold group-hover:text-primary underline-offset-2 group-hover:underline">{v}</div>
            )}
            {row.reservation && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Rés. {(row.reservation as any)?.reservation_number}
              </div>
            )}
          </div>
        );
      },
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
          {row.type === 'FA' && Number(row.balance) > 0 && <div className="text-xs text-red-600">Solde: {Number(row.balance).toLocaleString('fr-MA')}</div>}
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
          {/* Details */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5 text-slate-600 hover:bg-slate-50"
                onClick={() => router.push(`/billing/${row.id}`)}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voir les détails</TooltipContent>
          </Tooltip>
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
          {/* Mark paid: invoices only, approved or pending */}
          {row.type === 'FA' && ['approved', 'pending'].includes(row.status) && (
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
          {/* Unapprove — only for approved */}
          {row.status === 'approved' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-1.5 text-amber-700 hover:bg-amber-50 border-amber-200"
                  onClick={() => setUnapproveDoc(row)}>
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dévalider</TooltipContent>
            </Tooltip>
          )}
          {/* View PDF — opens in modal */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5 text-indigo-600 hover:bg-indigo-50"
                onClick={() => handleViewPdf(row.id)}>
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voir PDF</TooltipContent>
          </Tooltip>
          {/* Download PDF */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5 text-slate-600 hover:bg-slate-50"
                onClick={() => downloadPdfBlob(apiRoutes.billingExt.downloadPdf(row.id), `${row.document_number?.toLowerCase()}.pdf`)}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Télécharger PDF</TooltipContent>
          </Tooltip>
          {/* Edit — only for draft */}
          {row.status === 'draft' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-1.5"
                  onClick={() => router.push(`/billing/${row.id}/edit`)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Modifier (brouillon)</TooltipContent>
            </Tooltip>
          )}
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
        onAdd={() => router.push('/billing/create')}
        addLabel="Nouveau document"
      />
      <CustomTable<BillingDocument>
        url={apiRoutes.billing.list}
        columns={columns}
        filters={filters}
        onInit={(i) => setTableInstance(i)}
      />
      <CustomAlertDialog title="Supprimer le document ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
      {markPaidDoc && (
        <MarkPaidDialog
          open={!!markPaidDoc}
          onOpenChange={(o) => !o && setMarkPaidDoc(null)}
          document={markPaidDoc}
          onSuccess={() => { tableInstance?.refresh?.(); setMarkPaidDoc(null); }}
        />
      )}

      {unapproveDoc && (
        <UnapproveDialog
          open={!!unapproveDoc}
          onOpenChange={(o) => !o && setUnapproveDoc(null)}
          document={unapproveDoc}
          onSuccess={() => { tableInstance?.refresh?.(); setUnapproveDoc(null); }}
        />
      )}

      {/* PDF Preview Modal */}
      <Dialog open={!!pdfPreviewUrl} onOpenChange={(o) => !o && handleClosePdf()}>
        <DialogContent className="max-w-5xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40 shrink-0">
            <span className="text-sm font-medium text-muted-foreground">Aperçu du document</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClosePdf}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <iframe
            src={pdfPreviewUrl ?? ''}
            className="flex-1 w-full border-0"
            title="Aperçu PDF"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
