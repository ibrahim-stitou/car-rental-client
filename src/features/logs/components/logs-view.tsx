'use client';

import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig } from '@/components/custom/data-table/types';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import type { AuditLog } from '@/types/log.types';
import { Badge } from '@/components/ui/badge';

export function LogsView() {
  const columns: CustomTableColumn<AuditLog>[] = [
    { data: 'created_at', label: 'Date', sortable: true, render: (v) => <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(v).toLocaleString('fr-MA')}</span> },
    { data: 'causer', label: 'Utilisateur', sortable: false, render: (_v, row) => row.causer ? <span className="text-sm">{row.causer.first_name} {row.causer.last_name}</span> : <span className="text-muted-foreground text-sm">Système</span> },
    { data: 'description', label: 'Action', sortable: false, render: (v) => <span className="text-sm">{v}</span> },
    { data: 'subject_type', label: 'Ressource', sortable: false, render: (v) => { const name = (v as string)?.split('\\').pop() ?? v; return <Badge variant="outline" className="text-xs">{name}</Badge>; } },
    { data: 'log_name', label: 'Module', sortable: true, render: (v) => <Badge variant="outline" className="text-xs capitalize">{v}</Badge> },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Journal d'activité" description="Historique des actions du système (lecture seule)" />
      <CustomTable<AuditLog> url={apiRoutes.logs.list} columns={columns} filters={[]} />
    </div>
  );
}
