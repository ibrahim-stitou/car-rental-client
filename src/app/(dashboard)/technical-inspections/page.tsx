import type { Metadata } from 'next';
import { TechnicalInspectionsView } from '@/features/technical-inspections/components/technical-inspections-view';

export const metadata: Metadata = { title: 'Technical Inspections | MyFleet-Control' };

export default function TechnicalInspectionsPage() {
  return <TechnicalInspectionsView />;
}
