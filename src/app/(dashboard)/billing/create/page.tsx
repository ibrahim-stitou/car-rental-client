import type { Metadata } from 'next';
import { BillingCreateView } from '@/features/billing/components/billing-create-view';

export const metadata: Metadata = { title: 'Nouveau document | Facturation' };

export default function BillingCreatePage() {
  return <BillingCreateView />;
}
