import type { Metadata } from 'next';
import { MaintenanceFormView } from '@/features/maintenances/components/maintenance-form-view';

export const metadata: Metadata = { title: 'Nouvelle maintenance | MyFleet-Control' };

export default function NewMaintenancePage() {
  return <MaintenanceFormView />;
}
