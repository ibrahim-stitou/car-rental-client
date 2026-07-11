import type { Metadata } from 'next';
import { VignettesView } from '@/features/vignettes/components/vignettes-view';

export const metadata: Metadata = { title: 'Vignettes | MyFleet-Control' };

export default function VignettesPage() {
  return <VignettesView />;
}
