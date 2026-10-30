import type { Metadata } from 'next';
import { WebRequestAcceptView } from '@/features/website/components/web-request-accept-view';

export const metadata: Metadata = { title: 'Accepter la demande | MyFleet-Control' };

export default async function WebRequestAcceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WebRequestAcceptView requestId={id} />;
}
