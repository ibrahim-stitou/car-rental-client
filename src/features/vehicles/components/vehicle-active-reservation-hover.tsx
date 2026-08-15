'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { IconArrowRight } from '@tabler/icons-react';

interface Props {
  vehicleId: string;
  children: React.ReactNode;
}

/**
 * Wraps a "Loué" status badge: on hover, lazily fetches the vehicle's
 * current active reservation (no dedicated endpoint needed — the regular
 * reservations list already supports vehicle_id + status filtering) and
 * offers a direct link to it.
 */
export function VehicleActiveReservationHover({ vehicleId, children }: Props) {
  const [open, setOpen] = useState(false);

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['vehicle-active-reservation', vehicleId],
    queryFn: () => apiClient.get(apiRoutes.reservations.list, {
      params: { vehicle_id: vehicleId, status: 'active', per_page: 1 },
    }).then((r) => (r.data as any)?.data?.[0] ?? null),
    enabled: open,
    staleTime: 30_000,
  });

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-72">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Chargement…</p>
        ) : reservation ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Réservation en cours</span>
              <Badge variant="outline" className="font-mono text-xs">{reservation.reference ?? reservation.reservation_number}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">{reservation.client?.full_name ?? '—'}</p>
              {reservation.client?.phone && <p className="text-xs text-muted-foreground">{reservation.client.phone}</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              {reservation.pickup_date && format(parseISO(reservation.pickup_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
              {' → '}
              {reservation.return_date && format(parseISO(reservation.return_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </p>
            <Link
              href={`/reservations/${reservation.id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Voir la réservation <IconArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Aucune réservation active trouvée pour ce véhicule.</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
