import type { Metadata } from 'next';
import { WebsiteContentView } from '@/features/website/components/website-content-view';

export const metadata: Metadata = { title: 'Contenu du site | MyFleet-Control' };

export default function WebsiteContentPage() {
  return <WebsiteContentView />;
}
