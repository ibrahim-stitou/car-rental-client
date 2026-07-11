import type { Metadata } from 'next';
import { ParametersView } from '@/features/settings/components/parameters-view';

export const metadata: Metadata = { title: 'Paramètres métier | MyFleet-Control' };

export default function ParametersPage() {
  return <ParametersView />;
}
