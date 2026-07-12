import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReservationsView } from '@/features/reservations/components/reservations-view';

export const metadata: Metadata = { title: 'Reservations | MyFleet-Control' };

export default function ReservationsPage() {
  return (
    <Suspense>
      <ReservationsView />
    </Suspense>
  );
}
