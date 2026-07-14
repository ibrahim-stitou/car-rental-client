'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Edit, Trash2, Check, Play, Square, X, CreditCard, FileText, Receipt, UserX, Loader2, ExternalLink, MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { PaymentDialog } from './payment-dialog';
import { CompleteReservationDialog } from './complete-reservation-dialog';
import { ExtendReservationDialog } from './extend-reservation-dialog';
import { ValidateReservationDialog } from './validate-reservation-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Reservation } from '@/types/reservation.types';
import { RESERVATION_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/config/constants';
import { format, parseISO } from 'date-fns';
import { useCreateBillingFromReservation } from '@/features/billing/hooks/use-billing';
import { billingService } from '@/services/billing.service';
import Link from 'next/link';

const STATUS_CLS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  active:    'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  no_show:   'bg-gray-100 text-gray-600 border-gray-200',
};
const STATUS_FR: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', active: 'Active',
  completed: 'Terminée', cancelled: 'Annulée', no_show: 'Non présenté',
};
const PAY_CLS: Record<string, string> = {
  pending: 'text-amber-600', partial: 'text-orange-600', paid: 'text-green-600', refunded: 'text-purple-600',
};
const PAY_FR: Record<string, string> = { pending: 'Non payé', partial: 'Partiel', paid: 'Payé', refunded: 'Remboursé' };

async function fetchPdfBlob(url: string): Promise<string | null> {
  const toastId = toast.loading('Chargement du contrat…');
  try {
    const res = await apiClient.get<BlobPart>(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    toast.dismiss(toastId);
    return blobUrl;
  } catch {
    toast.dismiss(toastId);
    toast.error('Impossible de charger le contrat');
    return null;
  }
}

export function ReservationsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const overdueOnly = searchParams.get('overdue') === '1';
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Reservation>> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<{ id: string; ref: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [completeDialog, setCompleteDialog] = useState<{ id: string; ref: string; initialMileage?: number; returnLocation?: string } | null>(null);
  const [extendDialog, setExtendDialog] = useState<{ id: string; ref: string; returnDate?: string; status: string } | null>(null);
  const [validateDialog, setValidateDialog] = useState<{ id: string } | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const createInvoice = useCreateBillingFromReservation();

  const handleViewContract = async (reservationId: string) => {
    const url = await fetchPdfBlob(apiRoutes.reservationsExt.contract(reservationId));
    if (url) setPdfPreviewUrl(url);
  };

  const handleClosePdf = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  // Fetch current user profile to check signature/stamp
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get(apiRoutes.profile.show).then(r => r.data?.data),
  });
  const currentUserHasSignature = profileData?.has_signature ?? true; // default true to avoid blocking
  const currentUserHasStamp = profileData?.has_stamp ?? true;

  const handleValidateConfirm = () => {
    if (!validateDialog) return;
    doAction(validateDialog.id, apiRoutes.reservations.confirm(validateDialog.id), 'Réservation confirmée', 'patch');
    setValidateDialog(null);
  };

  const doAction = useCallback(async (id: string, url: string, msg: string, method: 'post' | 'patch' = 'patch') => {
    setPendingAction(id + url);
    try {
      method === 'patch' ? await apiClient.patch(url) : await apiClient.post(url);
      toast.success(msg);
      tableInstance?.refresh?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Action impossible';
      toast.error(msg);
    } finally {
      setPendingAction(null);
    }
  }, [tableInstance]);

  const handleGenerateInvoice = async (reservationId: string, ref: string) => {
    try {
      await createInvoice.mutateAsync({ reservationId, type: 'FA' });
      toast.success(`Facture générée pour ${ref}`);
    } catch {
      toast.error('Impossible de générer la facture');
    }
  };

  const columns: CustomTableColumn<Reservation>[] = [
    {
      data: 'reference',
      label: 'Référence',
      sortable: true,
      render: (v, row) => (
        <div className="cursor-pointer group" onClick={() => router.push(`/reservations/${row.id}`)}>
          <div className="font-mono text-sm font-semibold group-hover:text-primary group-hover:underline underline-offset-2">{v}</div>
          {(row as any).is_overdue && <Badge variant="destructive" className="text-[10px] h-4 px-1">En retard</Badge>}
        </div>
      ),
    },
    {
      data: 'vehicle',
      label: 'Véhicule',
      sortable: false,
      render: (_v, row) => (
        <div>
          <div className="text-sm font-medium">{(row.vehicle as any)?.full_name ?? '—'}</div>
          <div className="text-xs text-muted-foreground font-mono">{(row.vehicle as any)?.registration_number}</div>
        </div>
      ),
    },
    {
      data: 'client',
      label: 'Client',
      sortable: false,
      render: (_v, row) => (
        <div>
          <div className="text-sm">{(row.client as any)?.full_name ?? '—'}</div>
          <div className="text-xs text-muted-foreground">{(row.client as any)?.phone}</div>
        </div>
      ),
    },
    {
      data: 'pickup_date',
      label: 'Période',
      sortable: true,
      render: (v, row) => (
        <div className="text-xs">
          <div>{v ? format(parseISO(v as string), 'dd/MM/yy') : '—'}</div>
          <div className="text-muted-foreground">→ {row.return_date ? format(parseISO(row.return_date), 'dd/MM/yy') : '—'}</div>
        </div>
      ),
    },
    {
      data: 'status',
      label: 'Statut',
      sortable: true,
      render: (v) => <Badge variant="outline" className={`text-xs font-medium ${STATUS_CLS[v as string] ?? ''}`}>{STATUS_FR[v as string] ?? v}</Badge>,
    },
    {
      data: 'total_amount',
      label: 'Montant',
      sortable: true,
      render: (v, row) => (
        <div>
          <div className="font-semibold text-sm">{Number(v).toLocaleString('fr-MA')} MAD</div>
          <div className={`text-xs font-medium ${PAY_CLS[row.payment_status] ?? ''}`}>
            {PAY_FR[row.payment_status] ?? row.payment_status}
            {row.paid_amount > 0 && row.payment_status !== 'paid' && (
              <span className="ml-1 text-muted-foreground">({Number(row.paid_amount).toLocaleString('fr-MA')} payé)</span>
            )}
          </div>
        </div>
      ),
    },
    {
      data: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_v, row) => {
        const key = row.id;
        const busy = !!pendingAction && pendingAction.startsWith(key);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-0" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push(`/reservations/${row.id}`)}>
                <ExternalLink className="mr-2 h-4 w-4 text-slate-600" /> Voir les détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaymentDialog({ id: row.id, ref: row.reference })}>
                <CreditCard className="mr-2 h-4 w-4 text-violet-600" /> Paiements
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/reservations/${row.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Modifier
              </DropdownMenuItem>

              {row.status === 'pending' && (
                <DropdownMenuItem disabled={!!pendingAction} onClick={() => setValidateDialog({ id: row.id })}>
                  <Check className="mr-2 h-4 w-4 text-blue-600" /> Confirmer
                </DropdownMenuItem>
              )}

              {row.status === 'confirmed' && (
                <DropdownMenuItem disabled={!!pendingAction}
                  onClick={() => doAction(key, apiRoutes.reservations.activate(row.id), 'Réservation activée', 'patch')}>
                  <Play className="mr-2 h-4 w-4 text-green-600" /> Activer (départ)
                </DropdownMenuItem>
              )}

              {row.status === 'active' && (
                <DropdownMenuItem onClick={() => setCompleteDialog({
                  id: row.id,
                  ref: row.reference,
                  initialMileage: (row as any).initial_mileage ?? undefined,
                  returnLocation: row.return_location,
                })}>
                  <Square className="mr-2 h-4 w-4 text-slate-600" /> Terminer (retour)
                </DropdownMenuItem>
              )}

              {['pending', 'confirmed', 'active'].includes(row.status) && (
                <DropdownMenuItem onClick={() => setExtendDialog({ id: row.id, ref: row.reference, returnDate: row.return_date, status: row.status })}>
                  <PlusCircle className="mr-2 h-4 w-4 text-blue-600" /> Prolonger
                </DropdownMenuItem>
              )}

              {row.status === 'confirmed' && (
                <DropdownMenuItem disabled={!!pendingAction}
                  onClick={() => doAction(key, apiRoutes.reservationsExt.noShow(row.id), 'Marqué non présenté', 'patch')}>
                  <UserX className="mr-2 h-4 w-4 text-gray-500" /> Non présenté
                </DropdownMenuItem>
              )}

              {['pending', 'confirmed'].includes(row.status) && (
                <DropdownMenuItem disabled={!!pendingAction}
                  onClick={() => doAction(key, apiRoutes.reservations.cancel(row.id), 'Réservation annulée', 'patch')}>
                  <X className="mr-2 h-4 w-4 text-orange-600" /> Annuler
                </DropdownMenuItem>
              )}

              {['active', 'completed'].includes(row.status) && (
                <DropdownMenuItem onClick={() => handleViewContract(row.id)}>
                  <FileText className="mr-2 h-4 w-4 text-indigo-600" /> Contrat PDF
                </DropdownMenuItem>
              )}

              {row.status === 'completed' && (
                <DropdownMenuItem disabled={createInvoice.isPending} onClick={() => handleGenerateInvoice(row.id, row.reference)}>
                  <Receipt className="mr-2 h-4 w-4 text-emerald-600" /> Générer facture
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}>
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'search', label: 'Rechercher une réservation…', type: 'text' },
    { field: 'status', label: 'Statut', type: 'select', options: RESERVATION_STATUS_OPTIONS },
    { field: 'payment_status', label: 'Paiement', type: 'select', options: PAYMENT_STATUS_OPTIONS },
    { field: 'overdue', label: 'En retard uniquement', type: 'checkbox' },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.reservations.delete(deleteId));
      toast.success('Réservation supprimée');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer la réservation'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Réservations"
        description="Gestion des réservations de véhicules"
        onAdd={() => router.push('/reservations/create')}
        addLabel="Nouvelle réservation"
      />
      <CustomTable<Reservation>
        url={apiRoutes.reservations.list}
        columns={columns}
        filters={filters}
        onInit={(i) => setTableInstance(i)}
        rowClassName={(row) => row.is_overdue ? 'bg-red-50 hover:bg-red-100' : ''}
        initialState={overdueOnly ? { filters: { overdue: 1 } } : undefined}
      />
      <CustomAlertDialog title="Supprimer la réservation ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
      {paymentDialog && (
        <PaymentDialog
          open={!!paymentDialog}
          onOpenChange={(o) => !o && setPaymentDialog(null)}
          reservationId={paymentDialog.id}
          reservationRef={paymentDialog.ref}
        />
      )}
      {completeDialog && (
        <CompleteReservationDialog
          open={!!completeDialog}
          onOpenChange={(o) => !o && setCompleteDialog(null)}
          reservationId={completeDialog.id}
          reservationRef={completeDialog.ref}
          initialMileage={completeDialog.initialMileage}
          returnLocation={completeDialog.returnLocation}
          onSuccess={() => tableInstance?.refresh?.()}
        />
      )}
      {validateDialog && (
        <ValidateReservationDialog
          open={!!validateDialog}
          onOpenChange={(o) => !o && setValidateDialog(null)}
          onConfirm={handleValidateConfirm}
          loading={!!pendingAction}
          hasSignature={currentUserHasSignature}
          hasStamp={currentUserHasStamp}
        />
      )}
      {extendDialog && (
        <ExtendReservationDialog
          open={!!extendDialog}
          onOpenChange={(o) => !o && setExtendDialog(null)}
          reservationId={extendDialog.id}
          reservationRef={extendDialog.ref}
          currentReturnDate={extendDialog.returnDate}
          status={extendDialog.status}
          onSuccess={() => tableInstance?.refresh?.()}
        />
      )}

      <Dialog open={!!pdfPreviewUrl} onOpenChange={(o) => !o && handleClosePdf()}>
        <DialogContent className="max-w-5xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40 shrink-0">
            <span className="text-sm font-medium text-muted-foreground">Aperçu du contrat</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClosePdf}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <iframe
            src={pdfPreviewUrl ?? ''}
            className="flex-1 w-full border-0"
            title="Aperçu du contrat"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
