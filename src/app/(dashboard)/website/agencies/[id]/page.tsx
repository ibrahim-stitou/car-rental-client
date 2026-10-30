import type { Metadata } from 'next';
import { WebsiteAgencySheetView } from '@/features/website/components/website-agency-sheet-view';

export const metadata: Metadata = { title: "Présentation de l'agence | MyFleet-Control" };

export default async function WebsiteAgencyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WebsiteAgencySheetView agencyId={id} />;
}
