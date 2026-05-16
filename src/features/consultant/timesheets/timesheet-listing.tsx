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
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';

interface ConsultantTimesheet {
  id: number;
  month: string;
  year: number;
  status: string;
  mission: { id: number; title: string };
  mission_name: string;
  created_at: string;
  updated_at: string;
}

export function ConsultantTimesheetListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<ConsultantTimesheet>> | null>(null);

  const columns: CustomTableColumn<ConsultantTimesheet>[] = [
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
      data: 'status',
      label: t('admin.timesheets.table.status'),
      sortable: true,
      render: (value) => {
        const statusLabels = {
          validated: t('admin.timesheets.status.validated'),
          review: t('admin.timesheets.status.review'),
          rejected: t('admin.timesheets.status.rejected'),
          draft: t('admin.timesheets.show.status.draft')
        };

        const statusColors = {
          validated: "bg-green-100 text-green-800",
          review: "bg-yellow-100 text-yellow-800",
          rejected: "bg-red-100 text-red-800",
          draft: "bg-gray-100 text-gray-800"
        };

        return (
          <Badge className={
            //@ts-ignore
            statusColors[value] || ""}>{statusLabels[value as keyof typeof statusLabels] || value}
          </Badge>
        );
      }
    },
    {
      data: 'mission_name',
      label: t('admin.timesheets.table.mission'),
      sortable: true,
      render: (value, row) => (
        <span>{value}</span>
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
                onClick={() => router.push(`/consultant/timesheets/${row.id}/show`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.timesheets.view_details')}
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
      field: 'status',
      label: t('admin.timesheets.filters.status'),
      type: 'select',
      options: [
        { value: 'validated', label: t('admin.timesheets.status.validated') },
        { value: 'review', label: t('admin.timesheets.status.review') },
        { value: 'rejected', label: t('admin.timesheets.status.rejected') },
        { value: 'draft', label: t('admin.timesheets.show.status.draft') }
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
          <Link
            href='/consultant/timesheets/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <IconPlus className='mr-2 h-4 w-4' /> {t('consultant.timesheets.add')}
          </Link>
        </div>
        <Separator />
        <CustomTable<ConsultantTimesheet>
          columns={columns}
          url={apiRoutes.consultant.timesheets.list}
          filters={filters}
          onInit={(instance) => setTableInstance(instance)}
        />
      </div>
    </PageContainer>
  );
}