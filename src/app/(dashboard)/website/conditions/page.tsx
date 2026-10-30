import type { Metadata } from 'next';
import { WebsiteConditionsView } from '@/features/website/components/website-conditions-view';

export const metadata: Metadata = { title: 'Conditions de location | MyFleet-Control' };

export default function WebsiteConditionsPage() {
  return <WebsiteConditionsView />;
}
