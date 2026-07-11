import type { Metadata } from 'next';
import { BillingEditView } from '@/features/billing/components/billing-edit-view';

export const metadata: Metadata = { title: 'Modifier le document | Facturation' };

export default async function BillingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BillingEditView id={id} />;
}
