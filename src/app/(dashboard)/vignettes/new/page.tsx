import type { Metadata } from 'next';
import { VignetteFormView } from '@/features/vignettes/components/vignette-form-view';

export const metadata: Metadata = { title: 'Nouvelle vignette | MyFleet-Control' };

export default function NewVignettePage() {
  return <VignetteFormView />;
}
