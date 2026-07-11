import type { Metadata } from 'next';
import { VehiclesView } from '@/features/vehicles/components/vehicles-view';

export const metadata: Metadata = { title: 'Vehicles | MyFleet-Control' };

export default function VehiclesPage() {
  return <VehiclesView />;
}
