import type { Metadata } from 'next';
import { VehiclesView } from '@/features/vehicles/components/vehicles-view';

export const metadata: Metadata = { title: 'Vehicles | Car Rental' };

export default function Page() { return <VehiclesView />; }
