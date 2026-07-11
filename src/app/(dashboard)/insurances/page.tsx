import type { Metadata } from 'next';
import { InsurancesView } from '@/features/insurances/components/insurances-view';

export const metadata: Metadata = { title: 'Insurances | MyFleet-Control' };

export default function InsurancesPage() {
  return <InsurancesView />;
}
