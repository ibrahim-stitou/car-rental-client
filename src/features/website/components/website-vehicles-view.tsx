'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Pencil, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig } from '@/components/custom/data-table/types';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import type { WebsiteVehicle } from '@/types/website.types';
import { formatMad } from '../utils';

const TABS = [
  { value: 'all', label: 'Tous', query: '' },
  { value: 'published', label: 'En ligne', query: '?published=1' },
  { value: 'draft', label: 'Hors ligne', query: '?published=0' },
];

export function WebsiteVehiclesView() {
  const router = useRouter();
  const [tab, setTab] = useState('all');
  const query = TABS.find((t) => t.value === tab)?.query ?? '';

  const columns: CustomTableColumn<WebsiteVehicle>[] = [
    {
      data: 'photos',
      label: '',
      sortable: false,
      width: 72,
      render: (_, row) => {
        const cover = row.photos.find((p) => p.is_cover) ?? row.photos[0];
        return cover
          ? <img src={cover.thumb} alt="" className="h-10 w-16 rounded object-cover border" />
          : <div className="h-10 w-16 rounded border bg-muted flex items-center justify-center"><Car className="h-4 w-4 text-muted-foreground" /></div>;
      },
    },
    {
      data: 'full_name',
      label: 'Véhicule',
      sortable: false,
      render: (_, row) => (
        <div>
          <div className="text-sm font-medium flex items-center gap-1">
            {row.full_name}
            {row.website_featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
          </div>
          <div className="text-xs text-muted-foreground font-mono">{row.registration_number}</div>
        </div>
      ),
    },
    {
      data: 'agency',
      label: 'Agence',
      sortable: false,
      render: (_, row) => row.agency ? (
        <div className="text-sm">
          {row.agency.name}
          {!row.agency.show_on_website && <div className="text-xs text-amber-600">Agence hors ligne</div>}
        </div>
      ) : '—',
    },
    {
      data: 'website_price',
      label: 'Prix web',
      sortable: false,
      render: (_, row) => <span className="text-sm font-semibold">{formatMad(row.website_price)}<span className="text-xs font-normal text-muted-foreground"> /j</span></span>,
    },
    {
      data: 'checklist',
      label: 'Fiche',
      sortable: false,
      render: (_, row) => (
        <div className="w-28 space-y-1">
          <div className="text-xs text-muted-foreground">{row.checklist.score} %{row.checklist.missing.length > 0 && ` · ${row.checklist.missing.length} manquant(s)`}</div>
          <Progress value={row.checklist.score} className="h-1.5" />
        </div>
      ),
    },
    {
      data: 'show_on_website',
      label: 'Site',
      sortable: false,
      render: (v) => v
        ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">En ligne</Badge>
        : <Badge variant="outline" className="text-xs">Hors ligne</Badge>,
    },
    {
      data: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <Button variant="outline" size="sm" onClick={() => router.push(`/website/vehicles/${row.id}`)}>
          <Pencil className="h-3.5 w-3.5 mr-1" />Fiche web
        </Button>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'search', label: 'Marque, modèle, immatriculation…', type: 'text' },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Véhicules du site" description="Fiches web, photos et publication des véhicules" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>{TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}</TabsList>
      </Tabs>
      <CustomTable<WebsiteVehicle> key={tab} url={`${apiRoutes.website.vehicles}${query}`} columns={columns} filters={filters} />
    </div>
  );
}
