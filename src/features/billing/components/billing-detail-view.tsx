'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft, FileText, Download, Edit, CheckCircle, DollarSign,
  XCircle, Clock, User, AlertTriangle, Info, CheckCheck,
  Building2, Phone, Mail, MapPin, Hash, Calendar, Printer,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import PageContainer from '@/components/layout/page-container';
import { MarkPaidDialog } from './mark-paid-dialog';
import { UnapproveDialog } from './unapprove-dialog';
import { useBillingDocument, useBillingHistory, useApproveBillingDocument } from '../hooks/use-billing';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { BillingHistoryEntry } from '@/types/billing.types';

/* ─── Constants ───────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; cls: string; bar: string }> = {
  draft:     { label: 'Brouillon',  cls: 'bg-slate-100 text-slate-700 border-slate-200',  bar: 'bg-slate-400'  },
  pending:   { label: 'En attente', cls: 'bg-amber-100 text-amber-800 border-amber-200',   bar: 'bg-amber-400'  },
  approved:  { label: 'Approuvé',   cls: 'bg-blue-100 text-blue-800 border-blue-200',     bar: 'bg-blue-500'   },
  paid:      { label: 'Payé',       cls: 'bg-green-100 text-green-800 border-green-200',   bar: 'bg-green-500'  },
  cancelled: { label: 'Annulé',     cls: 'bg-red-100 text-red-800 border-red-200',         bar: 'bg-red-500'    },
};
const TYPE_COLOR: Record<string, string> = {
  FA: 'bg-emerald-100 text-emerald-800', DV: 'bg-blue-100 text-blue-800',
  BC: 'bg-violet-100 text-violet-800',   BR: 'bg-orange-100 text-orange-800',
  BL: 'bg-cyan-100 text-cyan-800',       AV: 'bg-rose-100 text-rose-800',
};
const TIMELINE_STYLE: Record<string, { icon: React.ReactNode; dot: string; ring: string }> = {
  info:    { icon: <Info       className="h-3.5 w-3.5" />, dot: 'bg-blue-500',   ring: 'ring-blue-100'   },
  success: { icon: <CheckCheck className="h-3.5 w-3.5" />, dot: 'bg-green-500',  ring: 'ring-green-100'  },
  warning: { icon: <AlertTriangle className="h-3.5 w-3.5" />, dot: 'bg-amber-500', ring: 'ring-amber-100' },
  error:   { icon: <XCircle    className="h-3.5 w-3.5" />, dot: 'bg-red-500',    ring: 'ring-red-100'    },
  default: { icon: <Clock      className="h-3.5 w-3.5" />, dot: 'bg-slate-400',  ring: 'ring-slate-100'  },
};

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

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function TimelineItem({ entry, isLast }: { entry: BillingHistoryEntry; isLast: boolean }) {
  const s = TIMELINE_STYLE[entry.type] ?? TIMELINE_STYLE.default;
  return (
    <div className="relative flex gap-4 pb-6">
      {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />}
      <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-4 ${s.dot} ${s.ring}`}>
        {s.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{entry.label}</p>
            {entry.user && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <User className="h-3 w-3" />{entry.user.name}
              </p>
            )}
          </div>
          <time className="shrink-0 text-[11px] text-muted-foreground">{fmtDateTime(entry.created_at)}</time>
        </div>
        {entry.detail && (
          <p className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground italic leading-relaxed">
            {entry.detail}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── PDF Frame ───────────────────────────────────────────────────────────── */

function PdfFrame({ docId, docNumber }: { docId: string; docNumber: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (blobUrl) return;
    setLoading(true); setError(false);
    try {
      const res = await apiClient.get<BlobPart>(apiRoutes.billingExt.viewPdf(docId), { responseType: 'blob' });
      setBlobUrl(URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' })));
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [docId, blobUrl]);

  const download = useCallback(async () => {
    const url = blobUrl ?? (() => {
      load();
      return null;
    })();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = `${docNumber.toLowerCase()}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, [blobUrl, docNumber, load]);

  // auto-load on mount
  useEffect(() => { load(); }, [load]);

  // cleanup on unmount
  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-3 text-muted-foreground">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm">Chargement du document PDF…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-3 text-muted-foreground">
        <XCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm">Impossible de charger le PDF.</p>
        <Button variant="outline" size="sm" onClick={() => { setBlobUrl(null); load(); }}>Réessayer</Button>
      </div>
    );
  }
  if (!blobUrl) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{docNumber}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(blobUrl, '_blank')}>
            <Eye className="h-4 w-4 mr-1" />Plein écran
          </Button>
          <Button variant="outline" size="sm" onClick={download}>
            <Download className="h-4 w-4 mr-1" />Télécharger
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const iframe = window.document.getElementById('pdf-print-frame') as HTMLIFrameElement;
            iframe?.contentWindow?.print();
          }}>
            <Printer className="h-4 w-4 mr-1" />Imprimer
          </Button>
        </div>
      </div>
      <iframe
        id="pdf-print-frame"
        src={blobUrl}
        className="w-full rounded-lg border border-border shadow-sm"
        style={{ height: '820px' }}
        title="Aperçu du document"
      />
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export function BillingDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: docRes, isLoading, refetch } = useBillingDocument(id);
  const { data: histRes, isLoading: histLoading, refetch: refetchHist } = useBillingHistory(id);
  const approveMutation = useApproveBillingDocument();

  const [markPaidOpen, setMarkPaidOpen]   = useState(false);
  const [unapproveOpen, setUnapproveOpen] = useState(false);

  const doc = docRes?.data ?? null;
  const history: BillingHistoryEntry[] = histRes?.data ?? [];
  const handleSuccess = () => { refetch(); refetchHist(); };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Document validé avec succès');
      handleSuccess();
    } catch { toast.error('Échec de la validation'); }
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <PageContainer scrollable>
        <div className="p-6 space-y-5 w-full">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-44 w-full" /><Skeleton className="h-56 w-full" />
            </div>
            <Skeleton className="h-72 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }
  if (!doc) {
    return (
      <PageContainer scrollable>
        <div className="p-6"><p className="text-muted-foreground">Document introuvable.</p></div>
      </PageContainer>
    );
  }

  const isTemp = doc.document_number?.startsWith('BROUILLON-');
  const statusCfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.draft;

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full">

        {/* ── Breadcrumb + title ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/billing')}>
            <ArrowLeft className="h-4 w-4" />Facturation
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{isTemp ? 'Brouillon' : doc.document_number}</span>
        </div>

        {/* ── Status banner ── */}
        <div className={`rounded-xl border px-5 py-4 flex items-center justify-between flex-wrap gap-4 ${statusCfg.cls}`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className={`h-10 w-1 rounded-full ${statusCfg.bar}`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">
                  {isTemp
                    ? <span className="text-muted-foreground italic">Référence en attente de validation</span>
                    : doc.document_number}
                </h1>
                <Badge variant="outline" className={`font-mono font-bold text-sm ${TYPE_COLOR[doc.type] ?? ''}`}>
                  {doc.type}
                </Badge>
              </div>
              <p className="text-xs mt-0.5 opacity-70">
                {statusCfg.label} · Créé le {fmtDate(doc.created_at)}
                {doc.approved_at && ` · Validé le ${fmtDate(doc.approved_at)}`}
              </p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {doc.status === 'draft' && (
              <Button size="sm" variant="outline" className="gap-1 bg-white/60 hover:bg-white"
                onClick={() => router.push(`/billing/${id}/edit`)}>
                <Edit className="h-4 w-4" />Modifier
              </Button>
            )}
            {['draft', 'pending'].includes(doc.status) && (
              <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                onClick={handleApprove} disabled={approveMutation.isPending}>
                <CheckCircle className="h-4 w-4" />
                {approveMutation.isPending ? 'Validation…' : 'Valider'}
              </Button>
            )}
            {doc.status === 'approved' && (
              <Button size="sm" variant="outline" className="gap-1 bg-white/60 hover:bg-amber-50 text-amber-700 border-amber-300"
                onClick={() => setUnapproveOpen(true)}>
                <AlertTriangle className="h-4 w-4" />Dévalider
              </Button>
            )}
            {['approved', 'pending'].includes(doc.status) && (
              <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                onClick={() => setMarkPaidOpen(true)}>
                <DollarSign className="h-4 w-4" />Marquer payé
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1 bg-white/60 hover:bg-white"
              onClick={async () => {
                const toastId = toast.loading('Téléchargement…');
                try {
                  const res = await apiClient.get<BlobPart>(apiRoutes.billingExt.downloadPdf(id), { responseType: 'blob' });
                  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                  const a = document.createElement('a'); a.href = url;
                  a.download = `${(doc.document_number ?? 'document').toLowerCase()}.pdf`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 5000);
                  toast.dismiss(toastId);
                } catch { toast.dismiss(toastId); toast.error('Impossible de télécharger le PDF'); }
              }}>
              <Download className="h-4 w-4" />PDF
            </Button>
          </div>
        </div>

        {/* ── Unapprove reason alert ── */}
        {doc.unapprove_reason && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-800">Motif de dévalidation : </span>
              <span className="text-amber-700 italic">{doc.unapprove_reason}</span>
            </div>
          </div>
        )}

        {/* ── Main tabs ── */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="details" className="gap-1.5">
              <FileText className="h-4 w-4" />Détails
            </TabsTrigger>
            <TabsTrigger value="pdf" className="gap-1.5">
              <Eye className="h-4 w-4" />Document PDF
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <Clock className="h-4 w-4" />Historique
            </TabsTrigger>
          </TabsList>

          {/* ════ DETAILS TAB ════ */}
          <TabsContent value="details" className="space-y-5 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

              {/* Left: infos */}
              <div className="lg:col-span-2 space-y-5">

                {/* Document info */}
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Informations du document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <InfoRow label="Référence"
                        value={isTemp
                          ? <Badge variant="outline" className="border-dashed text-amber-700 border-amber-300 bg-amber-50 text-xs">Réf. en attente</Badge>
                          : <span className="font-mono">{doc.document_number}</span>}
                      />
                      <InfoRow label="Type"
                        value={<Badge variant="outline" className={`font-mono text-xs ${TYPE_COLOR[doc.type] ?? ''}`}>{doc.type}</Badge>}
                      />
                      <InfoRow label="Date" value={fmtDate(doc.issue_date)} />
                      {doc.due_date && <InfoRow label="Échéance" value={fmtDate(doc.due_date)} />}
                      {(doc as any).delivery_date && <InfoRow label="Livraison" value={fmtDate((doc as any).delivery_date)} />}
                      {(doc as any).agency && (
                        <InfoRow label="Agence"
                          value={<span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{(doc as any).agency.name}</span>}
                        />
                      )}
                      {doc.reservation_id && (
                        <InfoRow label="Réservation"
                          value={<span className="font-mono text-xs">{(doc as any).reservation?.reservation_number ?? doc.reservation_id}</span>}
                        />
                      )}
                      {doc.approved_at && <InfoRow label="Validé le" value={fmtDate(doc.approved_at)} />}
                    </div>
                  </CardContent>
                </Card>

                {/* Client */}
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Informations client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Nom / Raison sociale</p>
                        <p className="text-base font-bold">{doc.client_name}</p>
                      </div>
                      {doc.client_ice && (
                        <InfoRow label="ICE (Identifiant Commun de l'Entreprise)"
                          value={<span className="font-mono text-sm">{doc.client_ice}</span>}
                        />
                      )}
                      {doc.client_address && (
                        <InfoRow label="Adresse"
                          value={<span className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />{doc.client_address}</span>}
                        />
                      )}
                      {doc.client_phone && (
                        <InfoRow label="Téléphone"
                          value={<span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{doc.client_phone}</span>}
                        />
                      )}
                      {doc.client_email && (
                        <InfoRow label="Email"
                          value={<span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{doc.client_email}</span>}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Line items */}
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Lignes de facturation</CardTitle>
                    <Badge variant="secondary" className="ml-auto text-xs">{(doc.items ?? []).length} ligne{(doc.items ?? []).length > 1 ? 's' : ''}</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Désignation</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">Qté</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">P.U. HT</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20">TVA</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Montant HT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(doc.items ?? []).length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Aucune ligne.</td></tr>
                        ) : (doc.items ?? []).map((item, i) => (
                          <tr key={i} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 font-medium">{item.description}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-mono">{fmtMoney(item.unit_price)}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="text-[10px] px-1.5">{item.tax_rate ?? 0}%</Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold">{fmtMoney(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>

              {/* Right: summary */}
              <div className="space-y-4">

                {/* Financial summary */}
                <Card className="border-2 border-primary/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Montant HT</span>
                      <span className="font-mono">{fmtMoney(doc.subtotal)} MAD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TVA</span>
                      <span className="font-mono">{fmtMoney(doc.tax_amount)} MAD</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total TTC</span>
                      <span className="font-mono text-lg">{fmtMoney(doc.total_amount)} MAD</span>
                    </div>
                    {Number(doc.paid_amount) > 0 && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-sm text-green-700">
                          <span>Payé</span>
                          <span className="font-mono">-{fmtMoney(doc.paid_amount)} MAD</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Solde</span>
                          <span className={`font-mono ${Number(doc.balance) <= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {fmtMoney(Math.max(0, Number(doc.balance)))} MAD
                          </span>
                        </div>
                      </>
                    )}
                    {doc.payment_method && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Mode de paiement</span>
                          <span className="capitalize font-medium">{doc.payment_method.replace(/_/g, ' ')}</span>
                        </div>
                        {doc.payment_reference && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Référence paiement</span>
                            <span className="font-mono">{doc.payment_reference}</span>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Metadata */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Métadonnées</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: 'Créé le',    value: fmtDateTime(doc.created_at) },
                      { label: 'Modifié le', value: fmtDateTime(doc.updated_at) },
                      { label: 'Validé le',  value: doc.approved_at ? fmtDateTime(doc.approved_at) : null },
                    ].filter(r => r.value).map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-xs gap-2">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className="font-medium text-right">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick PDF thumb */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Document PDF</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">Consultez l'aperçu complet dans l'onglet "Document PDF".</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs"
                        onClick={async () => {
                          const toastId = toast.loading('Chargement…');
                          try {
                            const res = await apiClient.get<BlobPart>(apiRoutes.billingExt.downloadPdf(id), { responseType: 'blob' });
                            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                            const a = document.createElement('a'); a.href = url;
                            a.download = `${(doc.document_number ?? 'document').toLowerCase()}.pdf`;
                            document.body.appendChild(a); a.click(); document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(url), 5000);
                            toast.dismiss(toastId);
                          } catch { toast.dismiss(toastId); toast.error('Erreur'); }
                        }}>
                        <Download className="h-3.5 w-3.5" />Télécharger
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ════ PDF TAB ════ */}
          <TabsContent value="pdf" className="mt-0">
            <Card>
              <CardContent className="p-5">
                <PdfFrame docId={id} docNumber={doc.document_number ?? 'document'} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════ HISTORY TAB ════ */}
          <TabsContent value="history" className="mt-0">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Historique des actions</CardTitle>
                {!histLoading && (
                  <Badge variant="secondary" className="ml-auto text-xs">{history.length} événement{history.length > 1 ? 's' : ''}</Badge>
                )}
              </CardHeader>
              <CardContent>
                {histLoading ? (
                  <div className="space-y-5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2 pt-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <Clock className="h-8 w-8" />
                    <p className="text-sm">Aucun historique disponible.</p>
                  </div>
                ) : (
                  <div className="pt-1">
                    {history.map((entry, idx) => (
                      <TimelineItem key={entry.id} entry={entry} isLast={idx === history.length - 1} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ── */}
      {markPaidOpen && (
        <MarkPaidDialog open={markPaidOpen} onOpenChange={setMarkPaidOpen} document={doc} onSuccess={handleSuccess} />
      )}
      <UnapproveDialog open={unapproveOpen} onOpenChange={setUnapproveOpen} document={doc} onSuccess={handleSuccess} />
    </PageContainer>
  );
}
