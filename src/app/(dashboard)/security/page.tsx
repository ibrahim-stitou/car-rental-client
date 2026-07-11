import type { Metadata } from 'next';
import { SecurityView } from '@/features/security/components/security-view';

export const metadata: Metadata = { title: 'Security | MyFleet-Control' };

export default function SecurityPage() {
  return <SecurityView />;
}
