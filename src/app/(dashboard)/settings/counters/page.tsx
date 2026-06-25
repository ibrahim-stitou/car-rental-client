import type { Metadata } from 'next';
import { CounterSettingsView } from '@/features/settings/components/counter-settings-view';

export const metadata: Metadata = { title: 'Gestion des Compteurs | Car Rental' };

export default function CounterSettingsPage() {
  return <CounterSettingsView />;
}
