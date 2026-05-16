'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PageContainer from '@/components/layout/page-container';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CustomTable from '@/components/custom/data-table/custom-table';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { apiRoutes } from '@/config/apiRoutes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';

interface Mission {
  id: number;
  title: string;
  client: { id: number; name: string };
  consultant: { id: number; full_name: string };
  client_name: string;
  consultant_name: string;
  status: string;
  tjm: string;
  tjm_type: string;
  date_debut: string;
  date_fin: string;
  created_at: string;
  updated_at: string;
}

export function MissionListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Mission>> | null>(null);
  const [selectedMission, setSelectedMission] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const handleDelete = (id: number) => {
    setSelectedMission(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedMission !== null) {
      apiClient
        .delete(apiRoutes.admin.missions.delete(selectedMission))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message || t('admin.missions.deleteSuccess'));
          if (tableInstance) {
            tableInstance.refresh?.();
          }
        })
        .catch((error) => {
          toast.error(error.message);
        });
    }
    setOpenDeleteModal(false);
  };

  const columns: CustomTableColumn<Mission>[] = [
    {
      data: 'id',
      label: t('admin.missions.table.id'),
      sortable: true
    },
    {
      data: 'title',
      label: t('admin.missions.table.title'),
      sortable: true
    },
    {
      data: 'client_name',
      label: t('admin.missions.table.client'),
      sortable: true,
      render: (value, row) => (
        <Button variant='link' asChild>
          <Link href={'/admin/clients/' + row.client.id + '/show'}>{value}</Link>
        </Button>
      )
    },
    {
      data: 'consultant_name',
      label: t('admin.missions.table.consultant'),
      sortable: true,
      render: (value, row) => (
        <Button variant='link' asChild>
          <Link href={'/admin/users/' + row.consultant.id + '/show'}>{value}</Link>
        </Button>
      )
    },
    {
      data: 'status',
      label: t('admin.missions.table.status'),
      sortable: true,
      render: (value) => {
        const statusLabels = {
          active: t('admin.missions.status.active'),
          inactive: t('admin.missions.status.inactive'),
          pending: t('admin.missions.status.pending')
        };

        const statusColors = {
          active: "bg-green-100 text-green-800",
          inactive: "bg-red-100 text-red-800",
          pending: "bg-yellow-100 text-yellow-800"
        };

        return (
          <Badge className={
            //@ts-ignore
            statusColors[value] || ""}>{statusLabels[value] || value}
          </Badge>
        );
      }
    },
    {
      data: 'tjm',
      label: t('admin.missions.table.tjm'),
      sortable: true,
      render: (value) => (
        <span>
          {parseFloat(value ?? '0').toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </span>
      )
    },
    {
      data: 'date_debut',
      label: t('admin.missions.table.startDate'),
      sortable: true
    },
    {
      data: 'date_fin',
      label: t('admin.missions.table.endDate'),
      sortable: true
    },
    {
      data: 'created_at',
      label: t('admin.missions.table.created_at'),
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.missions.table.actions'),
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/missions/${row.id}/show`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.missions.view_details')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/missions/${row.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.missions.edit__')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                className="h-8 w-8 bg-red-100 p-1.5 text-red-600 hover:bg-red-200"
                onClick={() => handleDelete(row.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="tooltip-content rounded-md bg-red-100 px-2 py-1 text-red-600 shadow-md"
              sideOffset={5}
            >
              {t('admin.missions.delete')}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'title',
      label: t('admin.missions.filters.title'),
      type: 'text'
    },
    {
      field: 'client_name',
      label: t('admin.missions.filters.client'),
      type: 'text'
    },
    {
      field: 'consultant_name',
      label: t('admin.missions.filters.consultant'),
      type: 'text'
    },
    {
      field: 'status',
      label: t('admin.missions.filters.status'),
      type: 'select',
      options: [
        { value: 'active', label: t('admin.missions.status.active') },
        { value: 'inactive', label: t('admin.missions.status.inactive') },
        { value: 'pending', label: t('admin.missions.status.pending') }
      ]
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className='flex items-start justify-between'>
        <Heading
          title={t('admin.missions.title') || 'Missions'}
          description={t('admin.missions.description') || 'Manage your missions'}
        />
        <Link
          href='/admin/missions/new'
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconPlus className='mr-2 h-4 w-4' /> {t('admin.missions.addNew') || 'Add Mission'}
        </Link>
      </div>
      <Separator />
      <CustomTable<Mission>
        columns={columns}
        url={apiRoutes.admin.missions.list}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />
      <CustomAlertDialog
        title={t('admin.missions.deleteModal.title')}
        description={t('admin.missions.deleteModal.description')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </div>
  );
}