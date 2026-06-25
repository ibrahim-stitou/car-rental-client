import type { Metadata } from 'next';
import { BillingDetailView } from '@/features/billing/components/billing-detail-view';

export const metadata: Metadata = { title: 'Détail du document | Facturation' };

export default function BillingDetailPage({ params }: { params: { id: string } }) {
  return <BillingDetailView id={params.id} />;
}
