import type { Metadata } from 'next';
import { TechnicalInspectionFormView } from '@/features/technical-inspections/components/technical-inspection-form-view';

export const metadata: Metadata = { title: 'Nouvelle visite technique | MyFleet-Control' };

export default function NewInspectionPage() {
  return <TechnicalInspectionFormView />;
}
