import type { Metadata } from 'next';
import { BillingEditView } from '@/features/billing/components/billing-edit-view';

export const metadata: Metadata = { title: 'Modifier le document | Facturation' };

export default function BillingEditPage({ params }: { params: { id: string } }) {
  return <BillingEditView id={params.id} />;
}
