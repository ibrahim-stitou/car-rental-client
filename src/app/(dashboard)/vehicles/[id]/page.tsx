import { VehicleDetailView } from '@/features/vehicles/components/vehicle-detail-view';

export const metadata = { title: 'Détail véhicule' };

interface Props { params: Promise<{ id: string }> }

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params;
  return <VehicleDetailView vehicleId={id} />;
}
