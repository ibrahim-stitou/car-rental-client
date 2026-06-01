import { ClientDetailView } from '@/features/clients/components/client-detail-view';

export const metadata = { title: 'Détail client' };

interface Props { params: Promise<{ id: string }> }

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  return <ClientDetailView clientId={id} />;
}
