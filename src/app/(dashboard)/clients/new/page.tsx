import type { Metadata } from 'next';
import { ClientForm } from '@/features/clients/components/client-form';

export const metadata: Metadata = { title: 'Nouveau client | MyFleet-Control' };

export default function NewClientPage() {
  return <ClientForm />;
}
