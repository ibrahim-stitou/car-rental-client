import type { Metadata } from 'next';
import { ClaimDetailView } from '@/features/claims/components/claim-detail-view';

export const metadata: Metadata = { title: 'Détail du sinistre | MyFleet-Control' };

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClaimDetailView claimId={id} />;
}
