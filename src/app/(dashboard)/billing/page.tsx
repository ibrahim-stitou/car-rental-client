import type { Metadata } from 'next';
import { BillingView } from '@/features/billing/components/billing-view';

export const metadata: Metadata = { title: 'Billing | MyFleet-Control' };

export default function BillingPage() {
  return <BillingView />;
}
