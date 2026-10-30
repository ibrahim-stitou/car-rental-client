'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlarmClock, Eye, Truck, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig } from '@/components/custom/data-table/types';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import type { WebRequest } from '@/types/website.types';
import { useWebRequestStats } from '../hooks/use-website';
import { REQUEST_STATUS, REQUEST_TABS } from '../constants';
import { formatDateTime, formatMad } from '../utils';

export function WebRequestStatusBadge({ request }: { request: Pick<WebRequest, 'status' | 'is_late'> }) {
  const s = REQUEST_STATUS[request.status];
  return (
    <div className="flex items-center gap-1">
      <Badge variant="outline" className={`text-xs ${s?.color ?? ''}`}>{s?.label ?? request.status}</Badge>
      {request.is_late && (
        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 gap-1">
          <AlarmClock className="h-3 w-3" />En retard
        </Badge>
      )}
    </div>
  );
}

export function WebRequestsView() {
  const router = useRouter();
  const [tab, setTab] = useState('open');
  const { data: statsRes } = useWebRequestStats({ refetchInterval: 60_000 });
  const stats = statsRes?.data;

  const params = new URLSearchParams(REQUEST_TABS.find((t) => t.value === tab)?.params ?? {}).toString();
  const url = `${apiRoutes.website.requests}${params ? `?${params}` : ''}`;

  const tabCount = (value: string) => {
    if (!stats) return null;
    if (value === 'open') return stats.open;
    if (value in stats.by_status) return stats.by_status[value as keyof typeof stats.by_status];
    return null;
  };

  const columns: CustomTableColumn<WebRequest>[] = [
    {
      data: 'reference',
      label: 'Référence',
      sortable: false,
      render: (v, row) => (
        <div>
          <div className="font-mono text-sm font-semibold">{v}</div>
          <div className="text-xs text-muted-foreground">{formatDateTime(row.created_at, 'dd/MM HH:mm')}</div>
        </div>
      ),
    },
    {
      data: 'full_name',
      label: 'Client',
      sortable: false,
      render: (_, row) => (
        <div>
          <div className="text-sm font-medium">{row.full_name}</div>
          <div className="text-xs text-muted-foreground">{row.phone}</div>
        </div>
      ),
    },
    {
      data: 'vehicle',
      label: 'Véhicule',
      sortable: false,
      render: (_, row) => (
        <div>
          <div className="text-sm">{row.vehicle?.full_name ?? '—'}</div>
          <div className="text-xs text-muted-foreground">{row.agency?.name}</div>
        </div>
      ),
    },
    {
      data: 'pickup_date',
      label: 'Période',
      sortable: false,
      render: (_, row) => (
        <div className="text-sm">
          <div>{formatDateTime(row.pickup_date, 'dd MMM HH:mm')} → {formatDateTime(row.return_date, 'dd MMM HH:mm')}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            {row.days} j
            {row.delivery_requested && <span className="flex items-center gap-0.5"><Truck className="h-3 w-3" />Livraison</span>}
            {row.is_one_way && <span className="flex items-center gap-0.5"><Undo2 className="h-3 w-3" />Aller simple</span>}
          </div>
        </div>
      ),
    },
    {
      data: 'estimated_total',
      label: 'Estimation',
      sortable: false,
      render: (v) => (v !== null ? <span className="text-sm font-semibold">{formatMad(v)}</span> : '—'),
    },
    {
      data: 'status',
      label: 'Statut',
      sortable: false,
      render: (_, row) => <WebRequestStatusBadge request={row} />,
    },
    {
      data: 'assigned_to',
      label: 'Suivi par',
      sortable: false,
      render: (_, row) => <span className="text-sm">{row.assigned_to?.full_name ?? <span className="text-muted-foreground italic">Personne</span>}</span>,
    },
    {
      data: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => router.push(`/website/requests/${row.id}`)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'search', label: 'Référence, nom, téléphone, e-mail…', type: 'text' },
    { field: 'date_from', label: 'Reçue depuis le', type: 'date' },
    { field: 'date_to', label: "Reçue jusqu'au", type: 'date' },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Demandes du site" description="Demandes de réservation reçues depuis le site public" />

      {stats && stats.late_first_contact > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlarmClock className="h-4 w-4" />
          {stats.late_first_contact} demande(s) attendent un premier contact depuis plus de 2 h.
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          {REQUEST_TABS.map((t) => {
            const count = tabCount(t.value);
            return (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                {t.label}
                {count !== null && count > 0 && <span className="rounded-full bg-muted-foreground/15 px-1.5 text-[10px] font-semibold">{count}</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <CustomTable<WebRequest>
        key={tab}
        url={url}
        columns={columns}
        filters={filters}
        rowClassName={(row) => (row.is_late ? 'bg-red-50/50' : '')}
      />
    </div>
  );
}
