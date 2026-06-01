import type { Metadata } from 'next';
import { ClientsView } from '@/features/clients/components/clients-view';

export const metadata: Metadata = { title: 'Clients | Car Rental' };

export default function ClientsPage() {
  return <ClientsView />;
}
