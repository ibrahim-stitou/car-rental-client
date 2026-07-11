'use client';

import { useMemo, useState } from 'react';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig } from '@/components/custom/data-table/types';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import { AUDIT_EVENT_LABELS, AUDIT_RESOURCE_OPTIONS, type AuditLog } from '@/types/log.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye } from 'lucide-react';
import { useUsers } from '@/features/users/hooks/use-users';
import { LogDetailDialog } from '@/features/logs/components/log-detail-dialog';

function resourceLabel(auditableType: string): string {
  const shortKey = auditableType?.split('\\').pop() ?? auditableType;
  const key = (shortKey ?? '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return AUDIT_RESOURCE_OPTIONS.find((o) => o.value === key)?.label ?? shortKey ?? '—';
}

const eventVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  created: 'default',
  updated: 'secondary',
  deleted: 'destructive',
  restored: 'outline',
};

export function LogsView() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { data: usersData } = useUsers({ per_page: 200 });

  const userOptions = useMemo(
    () =>
      (usersData?.data ?? []).map((u) => ({
        label: `${u.first_name} ${u.last_name}`,
        value: u.id,
      })),
    [usersData]
  );

  const columns: CustomTableColumn<AuditLog>[] = [
    {
      data: 'created_at',
      label: 'Date',
      sortable: true,
      render: (v) => <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(v).toLocaleString('fr-MA')}</span>,
    },
    {
      data: 'user',
      label: 'Utilisateur',
      sortable: false,
      render: (_v, row) => (row.user ? <span className="text-sm">{row.user.first_name} {row.user.last_name}</span> : <span className="text-muted-foreground text-sm">Système</span>),
    },
    {
      data: 'event',
      label: 'Action',
      sortable: false,
      render: (v) => <Badge variant={eventVariant[v] ?? 'outline'} className="text-xs">{AUDIT_EVENT_LABELS[v] ?? v}</Badge>,
    },
    {
      data: 'auditable_type',
      label: 'Ressource',
      sortable: false,
      render: (v) => <Badge variant="outline" className="text-xs">{resourceLabel(v)}</Badge>,
    },
    {
      data: 'id',
      label: 'Actions',
      sortable: false,
      render: (_v, row) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => setSelectedLog(row)}>
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Voir les détails</TooltipContent>
        </Tooltip>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'auditable_type', label: 'Ressource', type: 'select', options: AUDIT_RESOURCE_OPTIONS, group: 'primary' },
    { field: 'user_id', label: 'Utilisateur', type: 'select', options: userOptions, group: 'primary' },
    { field: 'date_from', label: 'Du', type: 'date', group: 'date' },
    { field: 'date_to', label: 'Au', type: 'date', group: 'date' },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Journal d'activité" description="Historique des actions du système, triées de la plus récente à la plus ancienne" />
      <CustomTable<AuditLog> url={apiRoutes.logs.list} columns={columns} filters={filters} />
      <LogDetailDialog log={selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)} />
    </div>
  );
}
