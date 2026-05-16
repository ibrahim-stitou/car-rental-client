'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CustomTable from '@/components/custom/data-table/custom-table';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { apiRoutes } from '@/config/apiRoutes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface Timesheet {
  id: number;
  month: string;
  year: number;
  consultant: { id: number; name: string };
  status: string;
  mission: { id: number; name: string };
  mission_name:string;
  consultant_name:string;
  created_at: string;
  updated_at: string;

}

export function TimesheetListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Timesheet>> | null>(null);
  const [selectedTimesheet, setSelectedTimesheet] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const handleDelete = (id: number) => {
    setSelectedTimesheet(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedTimesheet !== null) {
      apiClient
        .delete(apiRoutes.admin.timesheets.delete(selectedTimesheet))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message || t('admin.timesheets.deleteSuccess'));
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

  const columns: CustomTableColumn<Timesheet>[] = [
    {
      data: 'id',
      label: t('admin.timesheets.table.id'),
      sortable: true
    },
    {
      data: 'month',
      label: t('admin.timesheets.table.month'),
      sortable: true,
      render: (value) => {
        return t(`months.${value}`);
      }
    },
    {
      data: 'year',
      label: t('admin.timesheets.table.year'),
      sortable: true
    },
    {
      data: 'consultant_name',
      label: t('admin.timesheets.table.consultant'),
      sortable: true,
      render: (value, row) => (
        <Button variant='link' asChild>
          <Link href={'/admin/users/' + row.consultant.id +'/show'}>{value}</Link>
        </Button>
      )
    },
    {
      data: 'status',
      label: t('admin.timesheets.table.status'),
      sortable: true,
      render: (value) => {
        const statusLabels = {
          validated: t('admin.timesheets.status.validated'),
          review: t('admin.timesheets.status.review'),
          rejected: t('admin.timesheets.status.rejected')
        };

        const statusColors = {
          validated: "bg-green-100 text-green-800",
          review: "bg-yellow-100 text-yellow-800",
          rejected: "bg-red-100 text-red-800"
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
      data: 'mission_name',
      label: t('admin.timesheets.table.mission'),
      sortable: true,
      render: (value, row) => (
        <Button variant='link' asChild>
          <Link href={'/admin/missions/' + row.mission.id +'/show'}>{value}</Link>
        </Button>
      )
    },
    {
      data: 'created_at',
      label: t('admin.timesheets.table.created_at'),
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.timesheets.table.actions'),
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/timesheets/${row.id}/show`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.timesheets.view_details')}
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
              {t('admin.timesheets.delete')}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'month',
      label: t('admin.timesheets.filters.month'),
      type: 'select',
      options: Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: t(`months.${i + 1}`)
      }))
    },
    {
      field: 'year',
      label: t('admin.timesheets.filters.year'),
      type: 'number'
    },
    {
      field: 'consultant_name',
      label: t('admin.timesheets.filters.consultant'),
      type: 'text'
    },
    {
      field: 'status',
      label: t('admin.timesheets.filters.status'),
      type: 'select',
      options: [
        { value: 'validated', label: t('admin.timesheets.status.validated') },
        { value: 'review', label: t('admin.timesheets.status.review') },
        { value: 'rejected', label: t('admin.timesheets.status.rejected') }
      ]
    },
    {
      field: 'mission_name',
      label: t('admin.timesheets.filters.mission'),
      type: 'text'
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className='flex items-start justify-between'>
          <Heading
            title={t('admin.timesheets.title')}
            description={t('admin.timesheets.description')}
          />
        </div>
        <Separator />
        <CustomTable<Timesheet>
          columns={columns}
          url={apiRoutes.admin.timesheets.list}
          filters={filters}
          onInit={(instance) => setTableInstance(instance)}
        />
      </div>
      <CustomAlertDialog
        title={t('admin.timesheets.deleteModal.title')}
        description={t('admin.timesheets.deleteModal.description')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </PageContainer>
  );
}