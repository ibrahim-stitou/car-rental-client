import type { Metadata } from 'next';
import { ClientForm } from '@/features/clients/components/client-form';

export const metadata: Metadata = { title: 'Nouveau client | Car Rental' };

export default function NewClientPage() {
  return <ClientForm />;
}
