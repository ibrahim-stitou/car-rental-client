import type { Metadata } from 'next';
import { CompanySettingsView } from '@/features/settings/components/company-settings-view';

export const metadata: Metadata = { title: "Paramètres d'Entreprise | Car Rental" };

export default function CompanySettingsPage() {
  return <CompanySettingsView />;
}
