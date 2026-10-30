import type { Metadata } from 'next';
import { WebsiteExtrasView } from '@/features/website/components/website-extras-view';

export const metadata: Metadata = { title: 'Options de location | MyFleet-Control' };

export default function WebsiteExtrasPage() {
  return <WebsiteExtrasView />;
}
