import type { Metadata } from 'next';
import { ReservationDetailView } from '@/features/reservations/components/reservation-detail-view';

export const metadata: Metadata = { title: 'Détail de la réservation | GES Cars' };

export default function ReservationDetailPage({ params }: { params: { id: string } }) {
  return <ReservationDetailView id={params.id} />;
}
