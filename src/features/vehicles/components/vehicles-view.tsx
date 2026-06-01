'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { VehicleForm } from './vehicle-form';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Vehicle } from '@/types/vehicle.types';
import { VEHICLE_STATUS_OPTIONS, VEHICLE_CATEGORY_OPTIONS } from '@/config/constants';
import { IconCar } from '@tabler/icons-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rented: 'bg-blue-100 text-blue-800 border-blue-200',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  out_of_service: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible', rented: 'Loué', maintenance: 'En maintenance', out_of_service: 'Hors service',
};

export function VehiclesView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Vehicle>> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const columns: CustomTableColumn<Vehicle>[] = [
    {
      data: 'brand',
      label: 'Véhicule',
      sortable: true,
      render: (_value, row) => {
        const photo = row.photos?.[0]?.url;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-14 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
              {photo
                ? <img src={photo} alt={`${row.brand} ${row.model}`} className="h-full w-full object-cover" />
                : <IconCar className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <div className="font-medium text-sm">{row.brand} {row.model}</div>
              <div className="text-xs text-muted-foreground">{row.year} · {row.color}</div>
            </div>
          </div>
        );
      },
    },
    { data: 'registration_number', label: 'Immatriculation', sortable: true, render: (v) => <span className="font-mono text-sm">{v}</span> },
    { data: 'category', label: 'Catégorie', sortable: true, render: (v) => <Badge variant="outline" className="capitalize">{v}</Badge> },
    {
      data: 'status', label: 'Statut', sortable: true,
      render: (v) => (
        <Badge variant="outline" className={`text-xs font-medium ${STATUS_COLORS[v] ?? ''}`}>{STATUS_LABELS[v] ?? v}</Badge>
      ),
    },
    { data: 'daily_rate', label: 'Tarif/Jour', sortable: true, render: (v) => <span className="font-medium">{Number(v).toLocaleString('fr-MA')} MAD</span> },
    { data: 'mileage', label: 'Kilométrage', sortable: true, render: (v) => <span className="text-sm">{Number(v).toLocaleString()} km</span> },
    {
      data: 'actions', label: 'Actions', sortable: false,
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5" asChild><Link href={`/vehicles/${row.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>Détails</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => { setEditVehicle(row); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Modifier</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
        </div>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'search', label: 'Rechercher un véhicule…', type: 'text' },
    { field: 'status', label: 'Statut', type: 'select', options: VEHICLE_STATUS_OPTIONS },
    { field: 'category', label: 'Catégorie', type: 'select', options: VEHICLE_CATEGORY_OPTIONS },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.vehicles.delete(deleteId));
      toast.success('Véhicule supprimé');
      tableInstance?.refresh?.();
    } catch { toast.error('Impossible de supprimer le véhicule'); }
    setOpenDeleteModal(false); setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Véhicules" description="Gestion de la flotte de véhicules" onAdd={() => { setEditVehicle(null); setFormOpen(true); }} addLabel="Ajouter un véhicule" />
      <CustomTable<Vehicle> url={apiRoutes.vehicles.list} columns={columns} filters={filters} onInit={(i) => setTableInstance(i)} />
      <VehicleForm open={formOpen} onOpenChange={setFormOpen} vehicle={editVehicle} onSuccess={() => tableInstance?.refresh?.()} />
      <CustomAlertDialog title="Supprimer le véhicule ?" description="Cette action est irréversible." confirmText="Supprimer" cancelText="Annuler" open={openDeleteModal} setOpen={setOpenDeleteModal} onConfirm={handleConfirmDelete} />
    </div>
  );
}
