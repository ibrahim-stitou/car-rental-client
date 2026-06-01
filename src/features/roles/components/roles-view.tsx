'use client';

import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn } from '@/components/custom/data-table/types';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import { Badge } from '@/components/ui/badge';

const ROLE_FR: Record<string, string> = {
  'super-admin': 'Super Administrateur', admin: 'Administrateur', manager: 'Gestionnaire', agent: 'Agent', viewer: 'Observateur',
};

interface Role { id: string; name: string; guard_name: string; permissions_count?: number; users_count?: number; created_at: string; }

export function RolesView() {
  const columns: CustomTableColumn<Role>[] = [
    { data: 'name', label: 'Rôle', sortable: true, render: (v) => <span className="font-medium">{ROLE_FR[v as string] ?? v}</span> },
    { data: 'permissions_count', label: 'Permissions', sortable: false, render: (v) => <Badge variant="outline" className="text-xs">{v ?? 0}</Badge> },
    { data: 'users_count', label: 'Utilisateurs', sortable: false, render: (v) => <span className="text-sm">{v ?? 0}</span> },
    { data: 'created_at', label: 'Créé le', sortable: true, render: (v) => <span className="text-sm text-muted-foreground">{new Date(v).toLocaleDateString('fr-MA')}</span> },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Rôles et permissions" description="Rôles du système (lecture seule)" />
      <CustomTable<Role> url={apiRoutes.roles.list} columns={columns} filters={[]} />
    </div>
  );
}
