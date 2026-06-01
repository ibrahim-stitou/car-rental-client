import type { Metadata } from 'next';
import { RolesView } from '@/features/roles/components/roles-view';

export const metadata: Metadata = { title: 'Roles | Car Rental' };

export default function RolesPage() {
  return <RolesView />;
}
