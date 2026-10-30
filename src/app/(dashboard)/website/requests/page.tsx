import type { Metadata } from 'next';
import { WebRequestsView } from '@/features/website/components/web-requests-view';

export const metadata: Metadata = { title: 'Demandes du site | MyFleet-Control' };

export default function WebRequestsPage() {
  return <WebRequestsView />;
}
