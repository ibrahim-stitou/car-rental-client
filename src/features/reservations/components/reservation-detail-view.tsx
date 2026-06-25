'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft, Car, User, MapPin, Calendar, CreditCard, FileText,
  Download, Edit, Check, Play, Square, X, AlertTriangle, Clock,
  Phone, Mail, Hash, DollarSign, UserPlus, Eye, Printer,
  Info, CheckCheck, XCircle, ChevronDown, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageContainer from '@/components/layout/page-container';
import { PaymentDialog } from './payment-dialog';
import { CompleteReservationDialog } from './complete-reservation-dialog';
import { ExtendReservationDialog } from './extend-reservation-dialog';
import { useReservation } from '../hooks/use-reservations';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Reservation } from '@/types/reservation.types';
import { PAYMENT_METHOD_OPTIONS } from '@/config/constants';

/* ─── Constants ───────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; cls: string; bar: string }> = {
  pending:   { label: 'En attente',    cls: 'bg-amber-100 text-amber-800 border-amber-200',   bar: 'bg-amber-400'  },
  confirmed: { label: 'Confirmée',     cls: 'bg-blue-100 text-blue-800 border-blue-200',       bar: 'bg-blue-500'   },
  active:    { label: 'Active',        cls: 'bg-green-100 text-green-800 border-green-200',     bar: 'bg-green-500'  },
  completed: { label: 'Terminée',      cls: 'bg-slate-100 text-slate-700 border-slate-200',     bar: 'bg-slate-400'  },
  cancelled: { label: 'Annulée',       cls: 'bg-red-100 text-red-800 border-red-200',           bar: 'bg-red-500'    },
  no_show:   { label: 'Non présenté',  cls: 'bg-gray-100 text-gray-600 border-gray-200',        bar: 'bg-gray-400'   },
};
const PAY_CLS: Record<string, string> = {
  pending: 'text-amber-700', partial: 'text-orange-600', paid: 'text-green-700', refunded: 'text-purple-600',
};
const PAY_FR: Record<string, string> = { pending: 'Non payé', partial: 'Partiel', paid: 'Payé', refunded: 'Remboursé' };
const FUEL_FR: Record<string, string> = { empty: 'Vide', quarter: '1/4', half: '1/2', three_quarters: '3/4', full: 'Plein' };

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd/MM/yyyy', { locale: fr }); } catch { return String(d); }
}
function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—';
  try { return format(parseISO(d), "dd MMM yyyy 'à' HH:mm", { locale: fr }); } catch { return String(d); }
}
function fmtMoney(n: number | string | null | undefined) {
  return Number(n ?? 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

/* ─── Cancel dialog ───────────────────────────────────────────────────────── */

function CancelDialog({ open, onOpenChange, reservationId, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; reservationId: string; onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (reason.trim().length < 3) { toast.error('Motif requis'); return; }
    setLoading(true);
    try {
      await apiClient.patch(apiRoutes.reservations.cancel(reservationId), { reason: reason.trim() });
      toast.success('Réservation annulée');
      setReason(''); onOpenChange(false); onSuccess();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Impossible d\'annuler');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setReason(''); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <X className="h-5 w-5" />Annuler la réservation
          </DialogTitle>
          <DialogDescription>Cette action est irréversible. Veuillez saisir le motif.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Motif <span className="text-red-500">*</span></Label>
          <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Raison de l'annulation…" className="resize-none" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Fermer</Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading || reason.trim().length < 3}>
            {loading ? 'Annulation…' : 'Confirmer l\'annulation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Contract PDF frame ─────────────────────────────────────────────────── */

function ContractFrame({ resId, resRef }: { resId: string; resRef: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (blobUrl) return;
    setLoading(true); setError(false);
    try {
      const res = await apiClient.get<BlobPart>(apiRoutes.reservationsExt.contract(resId), { responseType: 'blob' });
      setBlobUrl(URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' })));
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [resId, blobUrl]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  const download = useCallback(() => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl; a.download = `contrat-${resRef.toLowerCase()}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, [blobUrl, resRef]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[600px] gap-3 text-muted-foreground">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm">Chargement du contrat…</p>
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[600px] gap-3 text-muted-foreground">
      <XCircle className="h-10 w-10 text-red-400" />
      <p className="text-sm">Impossible de charger le contrat.</p>
      <Button variant="outline" size="sm" onClick={() => { setBlobUrl(null); load(); }}>Réessayer</Button>
    </div>
  );
  if (!blobUrl) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">Contrat — {resRef}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(blobUrl, '_blank')}>
            <Eye className="h-4 w-4 mr-1" />Plein écran
          </Button>
          <Button variant="outline" size="sm" onClick={download}>
            <Download className="h-4 w-4 mr-1" />Télécharger
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const el = document.getElementById('contract-frame') as HTMLIFrameElement;
            el?.contentWindow?.print();
          }}>
            <Printer className="h-4 w-4 mr-1" />Imprimer
          </Button>
        </div>
      </div>
      <iframe id="contract-frame" src={blobUrl}
        className="w-full rounded-lg border shadow-sm" style={{ height: '820px' }} title="Contrat de location" />
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export function ReservationDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: res, isLoading, refetch } = useReservation(id);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [paymentOpen, setPaymentOpen]     = useState(false);
  const [cancelOpen, setCancelOpen]       = useState(false);
  const [completeOpen, setCompleteOpen]   = useState(false);
  const [extendOpen, setExtendOpen]       = useState(false);

  const reservation: Reservation | null = (res?.data as any) ?? null;

  const doAction = async (url: string, method: 'patch' | 'post', successMsg: string, body?: object) => {
    setPendingAction(url);
    try {
      method === 'patch'
        ? await apiClient.patch(url, body)
        : await apiClient.post(url, body);
      toast.success(successMsg);
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Action impossible');
    } finally { setPendingAction(null); }
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <PageContainer scrollable>
        <div className="p-6 space-y-5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4"><Skeleton className="h-44" /><Skeleton className="h-56" /></div>
            <Skeleton className="h-72" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!reservation) {
    return (
      <PageContainer scrollable>
        <div className="p-6"><p className="text-muted-foreground">Réservation introuvable.</p></div>
      </PageContainer>
    );
  }

  const statusCfg = STATUS_CONFIG[reservation.status] ?? STATUS_CONFIG.pending;
  const r = reservation as any;
  const days = r.days_count ?? r.total_days ?? 0;
  const balance = Number(reservation.total_amount) - Number(reservation.paid_amount);

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/reservations')}>
            <ArrowLeft className="h-4 w-4" />Réservations
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium font-mono">{r.reference ?? r.reservation_number}</span>
        </div>

        {/* Status banner */}
        <div className={`rounded-xl border px-5 py-4 flex items-center justify-between flex-wrap gap-4 ${statusCfg.cls}`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className={`h-10 w-1 rounded-full ${statusCfg.bar}`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-mono">{r.reference ?? r.reservation_number}</h1>
                <Badge variant="outline" className={statusCfg.cls}>{statusCfg.label}</Badge>
                {r.is_overdue && <Badge variant="destructive" className="text-xs">En retard</Badge>}
              </div>
              <p className="text-xs mt-0.5 opacity-70">
                {fmtDate(reservation.pickup_date)} → {fmtDate(reservation.return_date)}
                {days > 0 && ` · ${days} jour${days > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Modifier */}
            {['pending', 'confirmed'].includes(reservation.status) && (
              <Button size="sm" variant="outline" className="gap-1 bg-white/60 hover:bg-white"
                onClick={() => toast.info('Modification via le formulaire de liste')}>
                <Edit className="h-4 w-4" />Modifier
              </Button>
            )}
            {/* Confirmer */}
            {reservation.status === 'pending' && (
              <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                disabled={!!pendingAction}
                onClick={() => doAction(apiRoutes.reservations.confirm(id), 'patch', 'Réservation confirmée')}>
                {pendingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Confirmer
              </Button>
            )}
            {/* Activer */}
            {reservation.status === 'confirmed' && (
              <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                disabled={!!pendingAction}
                onClick={() => doAction(apiRoutes.reservations.activate(id), 'patch', 'Réservation activée')}>
                <Play className="h-4 w-4" />Activer (départ)
              </Button>
            )}
            {/* Terminer */}
            {reservation.status === 'active' && (
              <Button size="sm" className="gap-1 bg-slate-700 hover:bg-slate-800 text-white shadow-sm"
                onClick={() => setCompleteOpen(true)}>
                <Square className="h-4 w-4" />Terminer (retour)
              </Button>
            )}
            {/* Paiement */}
            {!['cancelled', 'no_show'].includes(reservation.status) && (
              <Button size="sm" variant="outline" className="gap-1 bg-white/60 hover:bg-violet-50 text-violet-700 border-violet-200"
                onClick={() => setPaymentOpen(true)}>
                <CreditCard className="h-4 w-4" />Paiements
              </Button>
            )}
            {/* Annuler */}
            {['pending', 'confirmed'].includes(reservation.status) && (
              <Button size="sm" variant="outline" className="gap-1 bg-white/60 hover:bg-red-50 text-red-700 border-red-200"
                onClick={() => setCancelOpen(true)}>
                <X className="h-4 w-4" />Annuler
              </Button>
            )}
            {/* Contrat PDF */}
            <Button size="sm" variant="outline" className="gap-1 bg-white/60 hover:bg-white"
              onClick={async () => {
                const toastId = toast.loading('Téléchargement…');
                try {
                  const res = await apiClient.get<BlobPart>(apiRoutes.reservationsExt.contract(id), { responseType: 'blob' });
                  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                  const a = document.createElement('a');
                  a.href = url; a.download = `contrat-${(r.reference ?? 'reservation').toLowerCase()}.pdf`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 5000);
                  toast.dismiss(toastId);
                } catch { toast.dismiss(toastId); toast.error('Impossible de télécharger le contrat'); }
              }}>
              <Download className="h-4 w-4" />Contrat PDF
            </Button>
          </div>
        </div>

        {/* Annulation reason */}
        {reservation.cancellation_reason && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-red-800">Motif d'annulation : </span>
              <span className="text-red-700 italic">{reservation.cancellation_reason}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="details" className="gap-1.5"><FileText className="h-4 w-4" />Détails</TabsTrigger>
            <TabsTrigger value="contract" className="gap-1.5"><Eye className="h-4 w-4" />Contrat PDF</TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="h-4 w-4" />Paiements</TabsTrigger>
          </TabsList>

          {/* ════ DETAILS ════ */}
          <TabsContent value="details" className="space-y-5 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <div className="lg:col-span-2 space-y-5">

                {/* Réservation info */}
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Informations de la réservation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <InfoRow label="Référence" value={<span className="font-mono">{r.reference ?? r.reservation_number}</span>} />
                      <InfoRow label="Statut" value={<Badge variant="outline" className={`${statusCfg.cls} text-xs`}>{statusCfg.label}</Badge>} />
                      <InfoRow label="Durée" value={days > 0 ? `${days} jour${days > 1 ? 's' : ''}` : '—'} />
                      <InfoRow label="Départ" value={fmtDate(reservation.pickup_date)} />
                      <InfoRow label="Retour prévu" value={fmtDate(reservation.return_date)} />
                      {reservation.actual_return_date && <InfoRow label="Retour effectif" value={fmtDate(reservation.actual_return_date)} />}
                      <InfoRow label="Lieu de départ"
                        value={<span className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />{r.pickup_location}</span>}
                      />
                      <InfoRow label="Lieu de retour"
                        value={<span className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />{r.return_location}</span>}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Véhicule */}
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Véhicule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Modèle</p>
                        <p className="text-base font-bold">
                          {reservation.vehicle?.brand} {reservation.vehicle?.model}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{reservation.vehicle?.registration_number}</p>
                      </div>
                      {reservation.vehicle?.category && <InfoRow label="Catégorie" value={reservation.vehicle.category} />}
                      {r.fuel_level_pickup && <InfoRow label="Carburant départ" value={FUEL_FR[r.fuel_level_pickup] ?? r.fuel_level_pickup} />}
                      {r.fuel_level_return && <InfoRow label="Carburant retour" value={FUEL_FR[r.fuel_level_return] ?? r.fuel_level_return} />}
                      {r.initial_mileage != null && <InfoRow label="Km départ" value={`${Number(r.initial_mileage).toLocaleString('fr-MA')} km`} />}
                      {r.final_mileage != null && <InfoRow label="Km retour" value={`${Number(r.final_mileage).toLocaleString('fr-MA')} km`} />}
                    </div>
                  </CardContent>
                </Card>

                {/* Client */}
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Nom</p>
                        <p className="text-base font-bold">
                          {reservation.client?.first_name} {reservation.client?.last_name}
                        </p>
                      </div>
                      {reservation.client?.phone && (
                        <InfoRow label="Téléphone"
                          value={<span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{reservation.client.phone}</span>}
                        />
                      )}
                      {reservation.client?.email && (
                        <InfoRow label="Email"
                          value={<span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{reservation.client.email}</span>}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 2nd driver */}
                {(r.second_driver_name || r.second_driver_id) && (
                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center gap-2">
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">2ᵉ conducteur</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {r.second_driver_name && <InfoRow label="Nom" value={r.second_driver_name} />}
                        {r.second_driver_license && <InfoRow label="N° permis" value={<span className="font-mono">{r.second_driver_license}</span>} />}
                        {r.second_driver_phone && <InfoRow label="Téléphone" value={r.second_driver_phone} />}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {(reservation.notes || r.agent_notes) && (
                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {reservation.notes && (
                        <div>
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes client</p>
                          <p className="text-sm">{reservation.notes}</p>
                        </div>
                      )}
                      {r.agent_notes && (
                        <div>
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes internes</p>
                          <p className="text-sm italic text-muted-foreground">{r.agent_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right sidebar */}
              <div className="space-y-4">
                {/* Financial */}
                <Card className="border-2 border-primary/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Récapitulatif financier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{days}j × {fmtMoney(reservation.daily_rate)} MAD</span>
                      <span className="font-mono">{fmtMoney(Number(reservation.daily_rate) * days)} MAD</span>
                    </div>
                    {Number(reservation.discount_percentage) > 0 && (
                      <div className="flex justify-between text-sm text-green-700">
                        <span>Remise {reservation.discount_percentage}%</span>
                        <span className="font-mono">-{fmtMoney(Number(reservation.total_amount) * Number(reservation.discount_percentage) / 100)} MAD</span>
                      </div>
                    )}
                    {Number(reservation.additional_fees) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frais supp.</span>
                        <span className="font-mono">+{fmtMoney(reservation.additional_fees)} MAD</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="font-mono text-lg">{fmtMoney(reservation.total_amount)} MAD</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Payé</span>
                      <span className="font-mono">{fmtMoney(reservation.paid_amount)} MAD</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Solde</span>
                      <span className={`font-mono ${balance <= 0 ? 'text-green-700' : 'text-amber-700'}`}>
                        {fmtMoney(Math.max(0, balance))} MAD
                      </span>
                    </div>
                    {reservation.payment_method && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Mode paiement</span>
                          <span className="capitalize font-medium">{reservation.payment_method.replace(/_/g, ' ')}</span>
                        </div>
                      </>
                    )}
                    <div className="mt-2">
                      <Badge variant="outline" className={`${PAY_CLS[reservation.payment_status] ?? ''} w-full justify-center text-xs py-1`}>
                        {PAY_FR[reservation.payment_status] ?? reservation.payment_status}
                      </Badge>
                    </div>
                    {Number(r.deposit_amount) > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground border-t pt-2 mt-2">
                        <span>Caution</span>
                        <span className="font-mono font-medium">{fmtMoney(r.deposit_amount)} MAD</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Agency */}
                {reservation.agency && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Agence</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm font-bold">{reservation.agency.name}</p>
                      {reservation.agency.city && <p className="text-xs text-muted-foreground">{reservation.agency.city}</p>}
                    </CardContent>
                  </Card>
                )}

                {/* Metadata */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Métadonnées</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5">
                    {[
                      { label: 'Créé le', value: fmtDateTime(reservation.created_at) },
                      { label: 'Modifié le', value: fmtDateTime(reservation.updated_at) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-xs gap-2">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className="font-medium text-right">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick actions */}
                {reservation.status === 'active' && (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="pt-4 space-y-2">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Réservation active</p>
                      <Button size="sm" variant="outline" className="w-full gap-1 text-xs"
                        onClick={() => setExtendOpen(true)}>
                        <Calendar className="h-3.5 w-3.5" />Prolonger
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ════ CONTRAT PDF ════ */}
          <TabsContent value="contract" className="mt-0">
            <Card>
              <CardContent className="p-5">
                <ContractFrame resId={id} resRef={r.reference ?? r.reservation_number ?? 'reservation'} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════ PAIEMENTS ════ */}
          <TabsContent value="payments" className="mt-0">
            <PaymentsTab reservationId={id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        reservationId={id}
        reservationRef={r.reference ?? r.reservation_number ?? ''}
      />
      {cancelOpen && (
        <CancelDialog open={cancelOpen} onOpenChange={setCancelOpen} reservationId={id} onSuccess={() => { refetch(); setCancelOpen(false); }} />
      )}
      {completeOpen && (
        <CompleteReservationDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          reservationId={id}
          reservationRef={r.reference ?? r.reservation_number ?? ''}
          initialMileage={r.initial_mileage ?? undefined}
          onSuccess={() => { refetch(); setCompleteOpen(false); }}
        />
      )}
      {extendOpen && (
        <ExtendReservationDialog
          open={extendOpen}
          onOpenChange={setExtendOpen}
          reservationId={id}
          reservationRef={r.reference ?? r.reservation_number ?? ''}
          currentReturnDate={reservation.return_date}
          status={reservation.status}
          onSuccess={() => { refetch(); setExtendOpen(false); }}
        />
      )}
    </PageContainer>
  );
}

/* ─── Payments tab ────────────────────────────────────────────────────────── */

function PaymentsTab({ reservationId }: { reservationId: string }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(apiRoutes.payments.list(reservationId));
      setPayments((res.data as any)?.data ?? []);
    } catch {} finally { setLoading(false); }
  }, [reservationId]);

  useEffect(() => { load(); }, [load]);

  const PAY_METHOD_FR: Record<string, string> = { cash: 'Espèces', card: 'Carte', bank_transfer: 'Virement', check: 'Chèque', online: 'En ligne' };

  if (loading) return (
    <Card><CardContent className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</CardContent></Card>
  );

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Historique des paiements</CardTitle>
        <Badge variant="secondary" className="ml-auto text-xs">{payments.length} paiement{payments.length > 1 ? 's' : ''}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
            <CreditCard className="h-8 w-8" />
            <p className="text-sm">Aucun paiement enregistré.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Mode</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase">Montant</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p: any, i: number) => (
                <tr key={p.id ?? i} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs">{fmtDate(p.payment_date ?? p.created_at)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{PAY_METHOD_FR[p.payment_method] ?? p.payment_method}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{fmtMoney(p.amount)} MAD</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground italic">{p.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
