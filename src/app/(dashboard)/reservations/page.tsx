import type { Metadata } from 'next';
import { ReservationsView } from '@/features/reservations/components/reservations-view';

export const metadata: Metadata = { title: 'Reservations | Car Rental' };

export default function ReservationsPage() {
  return <ReservationsView />;
}
