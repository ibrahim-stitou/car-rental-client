import type { Metadata } from 'next';
import { CounterSettingsView } from '@/features/settings/components/counter-settings-view';

export const metadata: Metadata = { title: 'Gestion des Compteurs | MyFleet-Control' };

export default function CounterSettingsPage() {
  return <CounterSettingsView />;
}
