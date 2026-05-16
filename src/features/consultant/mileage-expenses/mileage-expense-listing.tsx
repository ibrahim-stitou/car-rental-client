// src/features/consultant/mileage-expenses/mileage-expense-listing.tsx
'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import CustomTable from '@/components/custom/data-table/custom-table';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { apiRoutes } from '@/config/apiRoutes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';

interface MileageExpense {
  id: number;
  consultant_id: number;
  mission_id: number;
  mission_name: string;
  amount_ttc: string;
  total_km: number;
  status: 'draft' | 'to_sign' | 'validated' | 'rejected';
  month: number;
  year: number;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  mission: {
    id: number;
    title: string;
    client_id: number;
  };
}

export function MileageExpenseListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<MileageExpense>> | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const columns: CustomTableColumn<MileageExpense>[] = [
    {
      data: 'id',
      label: t('consultant.mileageExpenses.table.id') || 'ID',
      sortable: true
    },
    {
      data: 'mission_name',
      label: t('consultant.mileageExpenses.table.mission') || 'Mission',
      sortable: true
    },
    {
      data: 'month',
      label: t('consultant.mileageExpenses.table.month') || 'Month',
      sortable: true,
      render: (value) => {
        const monthNames = [
          t('common.months.1') || 'January',
          t('common.months.2') || 'February',
          t('common.months.3') || 'March',
          t('common.months.4') || 'April',
          t('common.months.5') || 'May',
          t('common.months.6') || 'June',
          t('common.months.7') || 'July',
          t('common.months.8') || 'August',
          t('common.months.9') || 'September',
          t('common.months.10') || 'October',
          t('common.months.11') || 'November',
          t('common.months.12') || 'December'
        ];
        return monthNames[parseInt(value) - 1] || value;
      }
    },
    {
      data: 'year',
      label: t('consultant.mileageExpenses.table.year') || 'Year',
      sortable: true
    },
    {
      data: 'total_km',
      label: t('consultant.mileageExpenses.table.totalKm') || 'Total KM',
      sortable: true,
      render: (value) => `${value ?? 0} km`
    },
    {
      data: 'amount_ttc',
      label: t('consultant.mileageExpenses.table.amount') || 'Amount',
      sortable: true,
      render: (value) =>
        new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
        }).format(parseFloat(value ?? '0'))
    },
    {
      data: 'status',
      label: t('consultant.mileageExpenses.table.status') || 'Status',
      sortable: true,
      render: (value) => {
        const statusLabels = {
          draft: t('consultant.mileageExpenses.status.draft') || 'Draft',
          to_sign: t('consultant.mileageExpenses.status.toSign') || 'To Sign',
          validated: t('consultant.mileageExpenses.status.validated') || 'Validated',
          rejected: t('consultant.mileageExpenses.status.rejected') || 'Rejected'
        };

        const statusColors = {
          draft: "bg-yellow-100 text-yellow-800",
          to_sign: "bg-blue-100 text-blue-800",
          validated: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800"
        };

        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || ""}>
            {statusLabels[value as keyof typeof statusLabels] || value}
          </Badge>
        );
      }
    },
    {
      data: 'created_at',
      label: t('consultant.mileageExpenses.table.createdAt') || 'Created At',
      sortable: true
    },
    {
      data: 'actions',
      label: t('consultant.mileageExpenses.table.actions') || 'Actions',
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/consultant/mileage-expenses/${row.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('consultant.mileageExpenses.actions.view') || 'View'}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'month',
      label: t('consultant.mileageExpenses.filters.month') || 'Month',
      type: 'select',
      options: [
        { value: '1', label: t('common.months.1') || 'January' },
        { value: '2', label: t('common.months.2') || 'February' },
        { value: '3', label: t('common.months.3') || 'March' },
        { value: '4', label: t('common.months.4') || 'April' },
        { value: '5', label: t('common.months.5') || 'May' },
        { value: '6', label: t('common.months.6') || 'June' },
        { value: '7', label: t('common.months.7') || 'July' },
        { value: '8', label: t('common.months.8') || 'August' },
        { value: '9', label: t('common.months.9') || 'September' },
        { value: '10', label: t('common.months.10') || 'October' },
        { value: '11', label: t('common.months.11') || 'November' },
        { value: '12', label: t('common.months.12') || 'December' }
      ]
    },
    {
      field: 'year',
      label: t('consultant.mileageExpenses.filters.year') || 'Year',
      type: 'select',
      options: generateYearOptions()
    },
    {
      field: 'status',
      label: t('consultant.mileageExpenses.filters.status') || 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: t('consultant.mileageExpenses.status.draft') || 'Draft' },
        { value: 'to_sign', label: t('consultant.mileageExpenses.status.toSign') || 'To Sign' },
        { value: 'validated', label: t('consultant.mileageExpenses.status.validated') || 'Validated' },
        { value: 'rejected', label: t('consultant.mileageExpenses.status.rejected') || 'Rejected' }
      ]
    },
  ];


  function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push({ value: i.toString(), label: i.toString() });
    }
    return years;
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading title={t('consultant.mileageExpenses.list.title')} description={t('consultant.mileageExpenses.list.subtitle')} />
        <Link
          href="/consultant/mileage-expenses/new"
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconPlus className="mr-2 h-4 w-4" /> {t('consultant.mileageExpenses.create.title')}
        </Link>
      </div>
      <Separator />

      <CustomTable<MileageExpense>
        columns={columns}
        url={apiRoutes.consultant.mileageExpenses.list}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />
    </div>
  );
}