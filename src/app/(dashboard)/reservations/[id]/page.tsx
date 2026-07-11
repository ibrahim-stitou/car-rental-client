import type { Metadata } from 'next';
import { ReservationDetailView } from '@/features/reservations/components/reservation-detail-view';

export const metadata: Metadata = { title: 'Détail de la réservation | MyFleet-Control' };

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReservationDetailView id={id} />;
}
