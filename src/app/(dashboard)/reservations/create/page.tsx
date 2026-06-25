import type { Metadata } from 'next';
import { ReservationCreateView } from '@/features/reservations/components/reservation-create-view';

export const metadata: Metadata = { title: 'Nouvelle réservation | GES Cars' };

export default function ReservationCreatePage() {
  return <ReservationCreateView />;
}
