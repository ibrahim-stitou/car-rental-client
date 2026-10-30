import type { Metadata } from 'next';
import { WebsiteVehiclesView } from '@/features/website/components/website-vehicles-view';

export const metadata: Metadata = { title: 'Véhicules du site | MyFleet-Control' };

export default function WebsiteVehiclesPage() {
  return <WebsiteVehiclesView />;
}
