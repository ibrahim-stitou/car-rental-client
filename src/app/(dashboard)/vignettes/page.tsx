import type { Metadata } from 'next';
import { VignettesView } from '@/features/vignettes/components/vignettes-view';

export const metadata: Metadata = { title: 'Vignettes | Car Rental' };

export default function VignettesPage() {
  return <VignettesView />;
}
