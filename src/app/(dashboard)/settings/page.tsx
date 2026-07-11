import type { Metadata } from 'next';
import { SettingsLanding } from '@/features/settings/components/settings-landing';

export const metadata: Metadata = { title: 'Paramètres | MyFleet-Control' };

export default function SettingsPage() {
  return <SettingsLanding />;
}
