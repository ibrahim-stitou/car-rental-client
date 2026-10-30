import type { Metadata } from 'next';
import { WebsiteDashboardView } from '@/features/website/components/website-dashboard-view';

export const metadata: Metadata = { title: 'Site web | MyFleet-Control' };

export default function WebsitePage() {
  return <WebsiteDashboardView />;
}
