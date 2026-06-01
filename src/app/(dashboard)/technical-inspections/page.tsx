import type { Metadata } from 'next';
import { TechnicalInspectionsView } from '@/features/technical-inspections/components/technical-inspections-view';

export const metadata: Metadata = { title: 'Technical Inspections | Car Rental' };

export default function TechnicalInspectionsPage() {
  return <TechnicalInspectionsView />;
}
