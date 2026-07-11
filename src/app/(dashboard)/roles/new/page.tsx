import type { Metadata } from 'next';
import { RoleFormView } from '@/features/roles/components/role-form-view';

export const metadata: Metadata = { title: 'Nouveau rôle | MyFleet-Control' };

export default function NewRolePage() {
  return <RoleFormView />;
}
