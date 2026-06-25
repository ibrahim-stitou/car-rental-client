import type { Metadata } from 'next';
import { SettingsLanding } from '@/features/settings/components/settings-landing';

export const metadata: Metadata = { title: 'Paramètres | Car Rental' };

export default function SettingsPage() {
  return <SettingsLanding />;
}
