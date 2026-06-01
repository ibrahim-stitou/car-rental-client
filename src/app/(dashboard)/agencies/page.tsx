import type { Metadata } from 'next';
import { AgenciesView } from '@/features/agencies/components/agencies-view';

export const metadata: Metadata = { title: 'Agencies | Car Rental' };

export default function AgenciesPage() {
  return <AgenciesView />;
}
