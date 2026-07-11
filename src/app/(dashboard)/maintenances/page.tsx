import type { Metadata } from 'next';
import { MaintenancesView } from '@/features/maintenances/components/maintenances-view';

export const metadata: Metadata = { title: 'Maintenances | MyFleet-Control' };

export default function MaintenancesPage() {
  return <MaintenancesView />;
}
