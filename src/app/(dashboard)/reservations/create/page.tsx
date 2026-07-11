import type { Metadata } from 'next';
import { ReservationCreateView } from '@/features/reservations/components/reservation-create-view';

export const metadata: Metadata = { title: 'Nouvelle réservation | MyFleet-Control' };

export default function ReservationCreatePage() {
  return <ReservationCreateView />;
}
