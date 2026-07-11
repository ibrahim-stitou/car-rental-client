import type { Metadata } from 'next';
import { ClientsView } from '@/features/clients/components/clients-view';

export const metadata: Metadata = { title: 'Clients | MyFleet-Control' };

export default function ClientsPage() {
  return <ClientsView />;
}
