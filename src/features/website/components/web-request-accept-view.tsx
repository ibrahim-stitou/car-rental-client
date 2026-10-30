'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, UserPlus } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SelectField } from '@/components/shared/select-field';
import { ClientForm } from '@/features/clients/components/client-form';
import { ReservationFormView } from '@/features/reservations/components/reservation-form-view';
import { useClients } from '@/features/clients/hooks/use-clients';
import { useDebounce } from '@/hooks/use-debounce';
import type { ConversionDefaults, WebRequest } from '@/types/website.types';
import { useWebRequest, useWebRequestClientMatches } from '../hooks/use-website';
import { formatDateTime } from '../utils';

type Step = 'client' | 'new-client' | 'reservation';

/** « 2026-11-02 10:00:00 » → valeur d'un champ datetime-local. */
const toLocalInput = (value: string) => value.slice(0, 16).replace(' ', 'T');

function reservationDefaults(d: ConversionDefaults, clientId: string) {
  return {
    agency_id: d.agency_id ?? '',
    vehicle_id: d.vehicle_id ?? '',
    client_id: clientId,
    pickup_date: toLocalInput(d.pickup_date),
    return_date: toLocalInput(d.return_date),
    pickup_location: d.pickup_location,
    return_location: d.return_location,
    rental_unit: 'day' as const,
    ...(d.daily_rate ? { daily_rate: Number(d.daily_rate) } : {}),
    additional_fees: Number(d.additional_fees ?? 0),
    notes: d.notes,
  };
}

export function WebRequestAcceptView({ requestId }: { requestId: string }) {
  const { data: res, isLoading } = useWebRequest(requestId);
  const request = res?.data;
  const [step, setStep] = useState<Step>('client');
  const [clientId, setClientId] = useState<string>('');

  if (isLoading) {
    return <PageContainer><div className="p-6 space-y-4 w-full"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64 w-full" /></div></PageContainer>;
  }
  if (!request || !request.conversion_defaults) {
    return <PageContainer><div className="p-6 text-muted-foreground">Demande introuvable.</div></PageContainer>;
  }
  if (!request.is_open) {
    return (
      <PageContainer>
        <div className="p-6 space-y-3">
          <p className="text-muted-foreground">Cette demande est déjà traitée.</p>
          <Button variant="outline" asChild><Link href={`/website/requests/${request.id}`}>Retour à la demande</Link></Button>
        </div>
      </PageContainer>
    );
  }

  if (step === 'new-client') {
    return (
      <ClientForm
        prefill={{
          first_name: request.first_name,
          last_name: request.last_name,
          email: request.email,
          phone: request.phone,
          agency_ids: request.agency ? [request.agency.id] : [],
          notes: `Client créé depuis la demande web ${request.reference}`,
        }}
        backHref={`/website/requests/${request.id}`}
        onCreated={(id) => { setClientId(id); setStep('reservation'); }}
      />
    );
  }

  if (step === 'reservation' && clientId) {
    return (
      <ReservationFormView
        webRequest={{
          id: request.id,
          reference: request.reference,
          defaults: reservationDefaults(request.conversion_defaults, clientId),
        }}
      />
    );
  }

  return (
    <ClientStep
      request={request}
      clientId={clientId || request.client?.id || ''}
      onSelect={setClientId}
      onNext={(id) => { setClientId(id); setStep('reservation'); }}
      onCreate={() => setStep('new-client')}
    />
  );
}

function ClientStep({ request, clientId, onSelect, onNext, onCreate }: {
  request: WebRequest;
  clientId: string;
  onSelect: (id: string) => void;
  onNext: (id: string) => void;
  onCreate: () => void;
}) {
  const { data: matchesRes, isLoading } = useWebRequestClientMatches(request.id);
  const matches = matchesRes?.data ?? [];
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const { data: clientsRes } = useClients({ per_page: 20, search: debounced || undefined });

  const options = useMemo(() => (clientsRes?.data ?? []).map((c: any) => ({
    value: c.id,
    label: (c.full_name ?? `${c.first_name ?? ''} ${c.last_name ?? ''}`).trim(),
    sub: [c.phone, c.id_number && `CIN ${c.id_number}`].filter(Boolean).join(' · '),
    keywords: c.id_number,
  })), [clientsRes]);

  const isMatch = matches.some((m) => m.id === clientId);

  // A single client with the same phone or e-mail is almost always the right one
  useEffect(() => {
    if (!clientId && matches.length === 1) onSelect(matches[0].id);
  }, [clientId, matches, onSelect]);

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/website/requests/${request.id}`}><ArrowLeft className="h-4 w-4 mr-1" />{request.reference}</Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Accepter la demande</h1>
            <p className="text-sm text-muted-foreground">Étape 1 sur 2 — client de la réservation</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 text-sm grid sm:grid-cols-3 gap-3">
            <div><p className="text-xs text-muted-foreground">Demandeur</p><p className="font-medium">{request.full_name}</p><p className="text-muted-foreground">{request.phone}</p></div>
            <div><p className="text-xs text-muted-foreground">Véhicule</p><p className="font-medium">{request.vehicle?.full_name ?? '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Période</p><p className="font-medium">{formatDateTime(request.pickup_date, 'dd/MM HH:mm')} → {formatDateTime(request.return_date, 'dd/MM HH:mm')}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Clients existants avec ce téléphone ou cet e-mail</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-16" /> : matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune correspondance.</p>
            ) : (
              <RadioGroup value={isMatch ? clientId : ''} onValueChange={onSelect} className="space-y-2">
                {matches.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer has-[[data-state=checked]]:border-primary">
                    <RadioGroupItem value={c.id} />
                    <span className="text-sm">
                      <span className="font-medium">{c.full_name}</span>
                      <span className="block text-xs text-muted-foreground">{[c.phone, c.email, c.id_number && `CIN ${c.id_number}`].filter(Boolean).join(' · ')}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Ou un autre client</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <SelectField
              value={isMatch ? '' : clientId}
              onChange={onSelect}
              options={options}
              onSearchChange={setSearch}
              placeholder="Rechercher par nom, téléphone, CIN…"
            />
            <Button variant="outline" onClick={onCreate}>
              <UserPlus className="h-4 w-4 mr-1.5" />Créer un nouveau client à partir de la demande
            </Button>
            <p className="text-xs text-muted-foreground">Le formulaire client sera prérempli avec le nom, le téléphone et l&apos;e-mail de la demande.</p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => onNext(clientId)} disabled={!clientId}>
            Continuer vers la réservation<ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
