import type { Metadata } from 'next';
import { AgenciesView } from '@/features/agencies/components/agencies-view';

export const metadata: Metadata = { title: 'Agencies | MyFleet-Control' };

export default function AgenciesPage() {
  return <AgenciesView />;
}
