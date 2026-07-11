import type { Metadata } from 'next';
import { BillingDetailView } from '@/features/billing/components/billing-detail-view';

export const metadata: Metadata = { title: 'Détail du document | Facturation' };

export default async function BillingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BillingDetailView id={id} />;
}
