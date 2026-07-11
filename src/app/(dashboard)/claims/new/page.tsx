import type { Metadata } from 'next';
import { ClaimFormView } from '@/features/claims/components/claim-form-view';

export const metadata: Metadata = { title: 'Déclarer un sinistre | MyFleet-Control' };

export default function NewClaimPage() {
  return <ClaimFormView />;
}
