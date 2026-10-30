'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft, Calendar, Car, CheckCircle2, Loader2, Mail, MapPin, MessageCircle, Phone, Plane, Send,
  Truck, Undo2, UserCheck, UserMinus, XCircle,
} from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import type { WebRequest, WebRequestEventType } from '@/types/website.types';
import {
  useAddWebRequestEvent, useAssignWebRequest, useWebRequest, useWebRequestAvailability, useWebRequestClientMatches,
  useWebsiteExtras,
} from '../hooks/use-website';
import { CALL_OUTCOMES, EVENT_TYPES, PICKUP_POINT_TYPES, REJECTION_CODES } from '../constants';
import { formatDateTime, formatMad, frText, toastWebsiteError } from '../utils';
import { WebRequestStatusBadge } from './web-requests-view';
import { WebRequestTimeline } from './web-request-timeline';
import { RejectWebRequestDialog } from './reject-web-request-dialog';

export function WebRequestDetailView({ requestId }: { requestId: string }) {
  const { data: res, isLoading } = useWebRequest(requestId);
  const request = res?.data;
  const { hasPermission, user } = useAuth();
  const canHandle = hasPermission('handle-website-requests');
  const canConvert = canHandle && hasPermission('create-reservation');
  const assignMutation = useAssignWebRequest(requestId);
  const [rejectOpen, setRejectOpen] = useState(false);

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div></PageContainer>;
  }
  if (!request) {
    return <PageContainer><div className="p-6 text-muted-foreground">Demande introuvable.</div></PageContainer>;
  }

  const assignedToMe = !!user?.id && request.assigned_to?.id === user.id;

  const handleAssign = (unassign: boolean) => {
    assignMutation.mutate(unassign ? { unassign: true } : {}, {
      onSuccess: () => toast.success(unassign ? 'Demande libérée' : 'Demande prise en charge'),
      onError: (err) => toastWebsiteError(err, 'Assignation impossible'),
    });
  };

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/website/requests"><ArrowLeft className="h-4 w-4 mr-1" />Demandes</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2 font-mono">{request.reference}</h1>
              <p className="text-sm text-muted-foreground">Reçue le {formatDateTime(request.created_at)}</p>
            </div>
            <WebRequestStatusBadge request={request} />
          </div>

          {canHandle && request.is_open && (
            <div className="flex flex-wrap gap-2">
              {assignedToMe ? (
                <Button variant="outline" size="sm" onClick={() => handleAssign(true)} disabled={assignMutation.isPending}>
                  <UserMinus className="h-4 w-4 mr-1.5" />Libérer
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleAssign(false)} disabled={assignMutation.isPending}>
                  <UserCheck className="h-4 w-4 mr-1.5" />Prendre en charge
                </Button>
              )}
              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setRejectOpen(true)}>
                <XCircle className="h-4 w-4 mr-1.5" />Refuser
              </Button>
              {canConvert && (
                <Button size="sm" asChild>
                  <Link href={`/website/requests/${request.id}/accept`}><CheckCircle2 className="h-4 w-4 mr-1.5" />Accepter</Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <OutcomeBanner request={request} />

        <div className="grid lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-4">
            <RequestSummaryCard request={request} />
            <Card>
              <CardHeader><CardTitle className="text-base">Échanges avec le client</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {canHandle && request.is_open && <AddEventForm requestId={request.id} isNew={request.status === 'new'} />}
                <WebRequestTimeline events={request.events ?? []} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <ContactCard request={request} />
            {request.is_open && <AvailabilityCard request={request} />}
            {request.is_open && <ClientMatchesCard requestId={request.id} />}
          </div>
        </div>
      </div>

      <RejectWebRequestDialog request={request} open={rejectOpen} onOpenChange={setRejectOpen} />
    </PageContainer>
  );
}

function OutcomeBanner({ request }: { request: WebRequest }) {
  if (request.status === 'converted' && request.reservation) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <span>
          Convertie en réservation <strong className="font-mono">{request.reservation.reservation_number}</strong>
          {request.handled_by && <> par {request.handled_by.full_name}</>} le {formatDateTime(request.handled_at)}.
        </span>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/reservations/${request.reservation.id}`}>Ouvrir la réservation</Link>
        </Button>
      </div>
    );
  }
  if (request.status === 'rejected') {
    const label = REJECTION_CODES.find((c) => c.value === request.rejection_code)?.label ?? request.rejection_code;
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Refusée{request.handled_by && <> par {request.handled_by.full_name}</>} le {formatDateTime(request.handled_at)} : <strong>{label}</strong>
        {request.rejection_reason && <> — {request.rejection_reason}</>}
      </div>
    );
  }
  if (request.status === 'cancelled' || request.status === 'expired') {
    return (
      <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        {request.status === 'cancelled' ? 'Annulée par le client' : 'Expirée sans traitement'} le {formatDateTime(request.handled_at)}.
      </div>
    );
  }
  return null;
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function RequestSummaryCard({ request }: { request: WebRequest }) {
  const { hasPermission } = useAuth();
  // La liste des options sert à retrouver leur libellé ; elle exige manage-website-content
  const { data: extrasRes } = useWebsiteExtras(hasPermission('manage-website-content'));
  const extraLabel = (code: string) => frText(extrasRes?.data?.find((e) => e.code === code)?.label) || code;
  const pointType = request.pickup_point ? PICKUP_POINT_TYPES.find((t) => t.value === request.pickup_point!.type)?.label : null;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Demande</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          {request.vehicle?.photo
            ? <img src={request.vehicle.photo} alt="" className="h-20 w-32 rounded-md border object-cover" />
            : <div className="h-20 w-32 rounded-md border bg-muted flex items-center justify-center"><Car className="h-6 w-6 text-muted-foreground" /></div>}
          <div className="space-y-0.5">
            <p className="font-semibold">{request.vehicle?.full_name ?? 'Véhicule supprimé'}</p>
            <p className="text-sm text-muted-foreground font-mono">{request.vehicle?.registration_number}</p>
            {request.vehicle && <p className="text-sm">{formatMad(request.vehicle.website_price)} / jour sur le site</p>}
          </div>
        </div>

        <Separator />

        <div className="grid sm:grid-cols-3 gap-4">
          <Info label="Départ"><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDateTime(request.pickup_date)}</span></Info>
          <Info label="Retour"><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDateTime(request.return_date)}</span></Info>
          <Info label="Durée">{request.days} jour(s)</Info>
          <Info label="Agence de départ">{request.agency?.name ?? '—'}</Info>
          <Info label="Retour">
            {request.is_one_way
              ? <span className="flex items-center gap-1 text-amber-700"><Undo2 className="h-3.5 w-3.5" />{request.return_agency?.name ?? 'Autre agence'}</span>
              : 'Même agence'}
          </Info>
          <Info label="Remise du véhicule">
            {request.delivery_requested ? (
              <span className="flex items-start gap-1 text-amber-700">
                <Truck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {request.pickup_point ? `${request.pickup_point.name}${pointType ? ` (${pointType})` : ''}` : request.delivery_address ?? 'Livraison demandée'}
              </span>
            ) : (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />En agence</span>
            )}
          </Info>
          {request.flight_number && <Info label="Vol"><span className="flex items-center gap-1"><Plane className="h-3.5 w-3.5" />{request.flight_number}</span></Info>}
          {request.driver_age && <Info label="Âge du conducteur">{request.driver_age} ans</Info>}
          <Info label="Langue du client">{(request.locale ?? 'fr').toUpperCase()}</Info>
        </div>

        {request.extras.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Options demandées</p>
            <ul className="text-sm space-y-0.5">
              {request.extras.map((line) => (
                <li key={line.code} className="flex justify-between">
                  <span>{line.quantity && line.quantity > 1 ? `${line.quantity} × ` : ''}{extraLabel(line.code)}</span>
                  {line.unit_price !== null && line.unit_price !== undefined && (
                    <span className="text-muted-foreground">{formatMad(line.unit_price)} {line.pricing === 'per_day' ? '/ jour' : '/ location'}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {request.estimated_total !== null && (
          <div className="flex justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">Estimation affichée au client</span>
            <span className="font-bold">{formatMad(request.estimated_total)}</span>
          </div>
        )}
        {(request.delivery_requested || request.is_one_way) && (
          <p className="text-xs text-muted-foreground">Les frais de livraison ou d&apos;aller simple ne sont pas inclus dans l&apos;estimation.</p>
        )}

        {request.message && (
          <div className="rounded-md border bg-amber-50/60 p-3 text-sm">
            <p className="text-xs font-semibold text-amber-800 mb-1">Message du client</p>
            <p className="whitespace-pre-wrap">{request.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContactCard({ request }: { request: WebRequest }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">{request.full_name}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm space-y-1">
          <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{request.phone}</p>
          <p className="flex items-center gap-2 break-all"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{request.email}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" asChild><a href={`tel:${request.phone}`}><Phone className="h-4 w-4 mr-1" />Appeler</a></Button>
          <Button variant="outline" size="sm" asChild disabled={!request.whatsapp_url}>
            <a href={request.whatsapp_url ?? '#'} target="_blank" rel="noreferrer" className="text-green-700">
              <MessageCircle className="h-4 w-4 mr-1" />WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${request.email}?subject=${encodeURIComponent(`Votre demande ${request.reference}`)}`}><Mail className="h-4 w-4 mr-1" />E-mail</a>
          </Button>
        </div>
        <Separator />
        <div className="text-sm space-y-1">
          <p className="flex justify-between"><span className="text-muted-foreground">Suivi par</span><span>{request.assigned_to?.full_name ?? '—'}</span></p>
          <p className="flex justify-between"><span className="text-muted-foreground">Premier contact</span><span>{formatDateTime(request.contacted_at)}</span></p>
          {request.client && (
            <p className="flex justify-between">
              <span className="text-muted-foreground">Client</span>
              <Link href={`/clients/${request.client.id}`} className="underline">{request.client.full_name}</Link>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AddEventForm({ requestId, isNew }: { requestId: string; isNew: boolean }) {
  const [type, setType] = useState<WebRequestEventType>('call');
  const [outcome, setOutcome] = useState('');
  const [body, setBody] = useState('');
  const mutation = useAddWebRequestEvent(requestId);

  const submit = () => {
    if (type === 'note' && !body.trim()) { toast.error('Écrivez la note.'); return; }
    mutation.mutate({ type, outcome: outcome || undefined, body: body.trim() || undefined }, {
      onSuccess: () => { toast.success('Échange enregistré'); setBody(''); setOutcome(''); },
      onError: (err) => toastWebsiteError(err, "Impossible d'enregistrer l'échange"),
    });
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      {isNew && <p className="text-xs text-muted-foreground">Le premier appel, message WhatsApp ou e-mail passe la demande en « Contactée ».</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => { setType(v as WebRequestEventType); setOutcome(''); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {type === 'call' && (
          <div className="space-y-1.5">
            <Label>Résultat</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>{CALL_OUTCOMES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>
      <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="Ce qui a été dit, prochaine étape…" />
      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}Enregistrer
        </Button>
      </div>
    </div>
  );
}

function AvailabilityCard({ request }: { request: WebRequest }) {
  const { data: res, isLoading } = useWebRequestAvailability(request.id, undefined, !!request.vehicle);
  const data = res?.data;
  const checkedName = request.vehicle?.full_name;

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Disponibilité</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {!request.vehicle ? (
          <p className="text-sm text-muted-foreground">Le véhicule demandé n&apos;existe plus.</p>
        ) : isLoading || !data ? (
          <Skeleton className="h-16" />
        ) : (
          <>
            {data.available ? (
              <p className="flex items-center gap-2 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" />{checkedName ?? 'Véhicule'} disponible sur la période.</p>
            ) : (
              <div className="space-y-1 text-sm text-red-700">
                <p className="flex items-center gap-2"><XCircle className="h-4 w-4" />{checkedName ?? 'Véhicule'} indisponible.</p>
                {data.conflict && (
                  <p className="text-xs">
                    Réservation <Link href={`/reservations/${data.conflict.id}`} className="underline font-mono">{data.conflict.reservation_number}</Link>
                    {data.conflict.client && <> ({data.conflict.client})</>} du {formatDateTime(data.conflict.pickup_date, 'dd/MM HH:mm')} au {formatDateTime(data.conflict.return_date, 'dd/MM HH:mm')}.
                  </p>
                )}
              </div>
            )}
            {data.alternatives.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Alternatives libres (même catégorie)</p>
                <ul className="space-y-1">
                  {data.alternatives.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate">{a.full_name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{a.registration_number} · {formatMad(a.daily_rate)}/j</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0 bg-green-50 text-green-700 border-green-200">Libre</Badge>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Vous pourrez choisir un autre véhicule au moment d&apos;accepter.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ClientMatchesCard({ requestId }: { requestId: string }) {
  const { data: res, isLoading } = useWebRequestClientMatches(requestId);
  const matches = res?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Clients existants correspondants</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-12" /> : matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun client avec ce téléphone ou cet e-mail : il faudra le créer.</p>
        ) : (
          <ul className="space-y-2">
            {matches.map((c) => (
              <li key={c.id} className="text-sm">
                <Link href={`/clients/${c.id}`} className="font-medium underline">{c.full_name}</Link>
                <div className="text-xs text-muted-foreground">{[c.phone, c.email, c.id_number && `CIN ${c.id_number}`].filter(Boolean).join(' · ')}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
