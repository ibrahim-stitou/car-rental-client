import type { Metadata } from 'next';
import { WebsiteAgenciesView } from '@/features/website/components/website-agencies-view';

export const metadata: Metadata = { title: 'Agences du site | MyFleet-Control' };

export default function WebsiteAgenciesPage() {
  return <WebsiteAgenciesView />;
}
