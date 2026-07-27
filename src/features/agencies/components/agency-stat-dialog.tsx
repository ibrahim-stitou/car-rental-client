'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import { useReservations } from '@/features/reservations/hooks/use-reservations';
import { useClients } from '@/features/clients/hooks/use-clients';
import { useAgencyCredits } from '../hooks/use-agencies';

export type AgencyStatType = 'vehicles' | 'rented' | 'reservations' | 'overdue' | 'clients' | 'credits';

interface Props {
  agencyId: string;
  type: AgencyStatType | null;
  onOpenChange: (open: boolean) => void;
}

function fdate(d?: string) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

const TITLES: Record<AgencyStatType, string> = {
  vehicles: 'Véhicules de l’agence',
  rented: 'Véhicules actuellement loués',
  reservations: 'Réservations de l’agence',
  overdue: 'Réservations en retard',
  clients: 'Clients de l’agence',
  credits: 'Contrats à l’origine du crédit client',
};

export function AgencyStatDialog({ agencyId, type, onOpenChange }: Props) {
  const open = !!type;

  const vehiclesQuery = useVehicles(
    type === 'vehicles' || type === 'rented'
      ? { agency_id: agencyId, per_page: 100, ...(type === 'rented' ? { status: 'rented' } : {}) }
      : undefined
  );
  const reservationsQuery = useReservations(
    type === 'reservations' || type === 'overdue' ? { agency_id: agencyId, per_page: 100 } : undefined
  );
  const clientsQuery = useClients(
    type === 'clients' ? { agency_id: agencyId, per_page: 100 } : undefined
  );
  const creditsQuery = useAgencyCredits(type === 'credits' ? agencyId : '');

  const isLoading = (type === 'vehicles' || type === 'rented') ? vehiclesQuery.isLoading
    : (type === 'reservations' || type === 'overdue') ? reservationsQuery.isLoading
    : type === 'clients' ? clientsQuery.isLoading
    : type === 'credits' ? creditsQuery.isLoading
    : false;

  const reservationItems = useMemo(() => {
    const list = reservationsQuery.data?.data ?? [];
    if (type === 'overdue') {
      const now = new Date();
      return list.filter((r: any) => ['active', 'confirmed'].includes(r.status) && new Date(r.return_date) < now);
    }
    return list;
  }, [reservationsQuery.data, type]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{type ? TITLES[type] : ''}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (type === 'vehicles' || type === 'rented') ? (
            <div className="space-y-2 p-1">
              {(vehiclesQuery.data?.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun véhicule</p>
              )}
              {(vehiclesQuery.data?.data ?? []).map((v: any) => (
                <Link key={v.id} href={`/vehicles/${v.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg text-sm hover:bg-muted/50">
                  <div>
                    <div className="font-medium">{v.brand} {v.model} {v.year}</div>
                    <div className="text-xs text-muted-foreground font-mono">{v.registration_number}</div>
                  </div>
                  <StatusBadge status={v.status} />
                </Link>
              ))}
            </div>
          ) : (type === 'reservations' || type === 'overdue') ? (
            <div className="space-y-2 p-1">
              {reservationItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune réservation</p>
              )}
              {reservationItems.map((r: any) => (
                <Link key={r.id} href={`/reservations/${r.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg text-sm hover:bg-muted/50">
                  <div>
                    <div className="font-mono font-medium">{r.reservation_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.client?.full_name ?? r.client?.first_name} · {fdate(r.pickup_date)} → {fdate(r.return_date)}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          ) : type === 'clients' ? (
            <div className="space-y-2 p-1">
              {(clientsQuery.data?.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun client</p>
              )}
              {(clientsQuery.data?.data ?? []).map((c: any) => (
                <Link key={c.id} href={`/clients/${c.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg text-sm hover:bg-muted/50">
                  <div>
                    <div className="font-medium">{c.first_name} {c.last_name}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </div>
                  {c.is_blacklisted && <span className="text-xs text-red-600 font-medium">Blacklisté</span>}
                </Link>
              ))}
            </div>
          ) : type === 'credits' ? (
            <div className="space-y-2 p-1">
              {(creditsQuery.data?.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun contrat en créance</p>
              )}
              {(creditsQuery.data?.data ?? []).map((r: any) => (
                <Link key={r.id} href={`/reservations/${r.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg text-sm hover:bg-muted/50">
                  <div>
                    <div className="font-mono font-medium">{r.reservation_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.client ? `${r.client.first_name} ${r.client.last_name}` : '—'} · {r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">{fdate(r.pickup_date)} → {fdate(r.return_date)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-orange-700">{Number(r.credit_amount).toLocaleString('fr-MA')} MAD</div>
                      <div className="text-xs text-muted-foreground">
                        {Number(r.paid_amount).toLocaleString('fr-MA')} / {Number(r.total_amount).toLocaleString('fr-MA')} MAD
                      </div>
                    </div>
                    {r.status && <StatusBadge status={r.status} />}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
