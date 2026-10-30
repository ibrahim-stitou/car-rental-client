import type { Metadata } from 'next';
import { WebsiteVehicleSheetView } from '@/features/website/components/website-vehicle-sheet-view';

export const metadata: Metadata = { title: 'Fiche web du véhicule | MyFleet-Control' };

export default async function WebsiteVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WebsiteVehicleSheetView vehicleId={id} />;
}
