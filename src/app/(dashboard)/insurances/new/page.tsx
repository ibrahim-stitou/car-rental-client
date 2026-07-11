import type { Metadata } from 'next';
import { InsuranceFormView } from '@/features/insurances/components/insurance-form-view';

export const metadata: Metadata = { title: 'Nouvelle assurance | MyFleet-Control' };

export default function NewInsurancePage() {
  return <InsuranceFormView />;
}
