import type { Metadata } from 'next';
import { ReservationFormView } from '@/features/reservations/components/reservation-form-view';

export const metadata: Metadata = { title: 'Nouvelle réservation | MyFleet-Control' };

export default function ReservationCreatePage() {
  return <ReservationFormView />;
}
