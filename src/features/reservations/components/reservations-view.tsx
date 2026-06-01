'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2, Check, Play, Square, X, CreditCard, FileText, Receipt, UserX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { ReservationForm } from './reservation-form';
import { PaymentDialog } from './payment-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Reservation } from '@/types/reservation.types';
import { RESERVATION_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/config/constants';
import { format, parseISO } from 'date-fns';
import { useCreateBillingFromReservation } from '@/features/billing/hooks/use-billing';
import { billingService } from '@/services/billing.service';

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

export function ReservationsView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Reservation>> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editRes, setEditRes] = useState<Reservation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<{ id: string; ref: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const createInvoice = useCreateBillingFromReservation();

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
        <div>
          <div className="font-mono text-sm font-semibold">{v}</div>
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
        const busy = (url: string) => pendingAction === key + url;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {/* Paiements */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-1.5 text-violet-600 hover:bg-violet-50"
                  onClick={() => setPaymentDialog({ id: row.id, ref: row.reference })}>
                  <CreditCard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Paiements</TooltipContent>
            </Tooltip>

            {/* Modifier */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-1.5"
                  onClick={() => { setEditRes(row); setFormOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Modifier</TooltipContent>
            </Tooltip>

            {/* Confirmer (pending) */}
            {row.status === 'pending' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="h-8 w-8 p-1.5 text-blue-600 hover:bg-blue-50"
                    disabled={!!pendingAction}
                    onClick={() => doAction(key, apiRoutes.reservations.confirm(row.id), 'Réservation confirmée', 'patch')}>
                    {busy(apiRoutes.reservations.confirm(row.id)) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Confirmer</TooltipContent>
              </Tooltip>
            )}

            {/* Activer (confirmed) */}
            {row.status === 'confirmed' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="h-8 w-8 p-1.5 text-green-600 hover:bg-green-50"
                    disabled={!!pendingAction}
                    onClick={() => doAction(key, apiRoutes.reservations.activate(row.id), 'Réservation activée', 'patch')}>
                    {busy(apiRoutes.reservations.activate(row.id)) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Activer (départ)</TooltipContent>
              </Tooltip>
            )}

            {/* Terminer (active) */}
            {row.status === 'active' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="h-8 w-8 p-1.5 text-slate-600 hover:bg-slate-50"
                    disabled={!!pendingAction}
                    onClick={() => doAction(key, apiRoutes.reservations.complete(row.id), 'Réservation terminée', 'patch')}>
                    {busy(apiRoutes.reservations.complete(row.id)) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Terminer (retour)</TooltipContent>
              </Tooltip>
            )}

            {/* No-show (confirmed) */}
            {row.status === 'confirmed' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="h-8 w-8 p-1.5 text-gray-500 hover:bg-gray-50"
                    disabled={!!pendingAction}
                    onClick={() => doAction(key, apiRoutes.reservationsExt.noShow(row.id), 'Marqué non présenté', 'patch')}>
                    {busy(apiRoutes.reservationsExt.noShow(row.id)) ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Non présenté</TooltipContent>
              </Tooltip>
            )}

            {/* Annuler (pending / confirmed) */}
            {['pending', 'confirmed'].includes(row.status) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="h-8 w-8 p-1.5 text-orange-600 hover:bg-orange-50"
                    disabled={!!pendingAction}
                    onClick={() => doAction(key, apiRoutes.reservations.cancel(row.id), 'Réservation annulée', 'patch')}>
                    {busy(apiRoutes.reservations.cancel(row.id)) ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Annuler</TooltipContent>
              </Tooltip>
            )}

            {/* Contrat PDF (active / completed) */}
            {['active', 'completed'].includes(row.status) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="h-8 w-8 p-1.5 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => window.open(apiRoutes.reservationsExt.contract(row.id), '_blank')}>
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Contrat PDF</TooltipContent>
              </Tooltip>
            )}

            {/* Générer facture (completed) */}
            {row.status === 'completed' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="h-8 w-8 p-1.5 text-emerald-600 hover:bg-emerald-50"
                    disabled={createInvoice.isPending}
                    onClick={() => handleGenerateInvoice(row.id, row.reference)}>
                    {createInvoice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Générer facture</TooltipContent>
              </Tooltip>
            )}

            {/* Supprimer */}
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
        );
      },
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'search', label: 'Rechercher une réservation…', type: 'text' },
    { field: 'status', label: 'Statut', type: 'select', options: RESERVATION_STATUS_OPTIONS },
    { field: 'payment_status', label: 'Paiement', type: 'select', options: PAYMENT_STATUS_OPTIONS },
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
        onAdd={() => { setEditRes(null); setFormOpen(true); }}
        addLabel="Nouvelle réservation"
      />
      <CustomTable<Reservation>
        url={apiRoutes.reservations.list}
        columns={columns}
        filters={filters}
        onInit={(i) => setTableInstance(i)}
      />
      <ReservationForm open={formOpen} onOpenChange={setFormOpen} reservation={editRes} onSuccess={() => tableInstance?.refresh?.()} />
      <CustomAlertDialog title="Supprimer la réservation ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
      {paymentDialog && (
        <PaymentDialog
          open={!!paymentDialog}
          onOpenChange={(o) => !o && setPaymentDialog(null)}
          reservationId={paymentDialog.id}
          reservationRef={paymentDialog.ref}
        />
      )}
    </div>
  );
}
