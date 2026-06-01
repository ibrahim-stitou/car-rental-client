import { AgencyDetailView } from '@/features/agencies/components/agency-detail-view';

export const metadata = { title: 'Détail agence' };

interface Props { params: Promise<{ id: string }> }

export default async function AgencyDetailPage({ params }: Props) {
  const { id } = await params;
  return <AgencyDetailView agencyId={id} />;
}
