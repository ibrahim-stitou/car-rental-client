import type { Metadata } from 'next';
import { WebRequestDetailView } from '@/features/website/components/web-request-detail-view';

export const metadata: Metadata = { title: 'Demande du site | MyFleet-Control' };

export default async function WebRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WebRequestDetailView requestId={id} />;
}
