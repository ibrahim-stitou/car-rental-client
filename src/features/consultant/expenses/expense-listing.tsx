// src/features/consultant/expenses/expense-listing.tsx
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

interface Expense {
  id: number;
  consultant_id: number;
  mission_id: number;
  mission_name: string;
  month: string;
  year: string;
  total_ttc: string;
  validated_at: string | null;
  commentaire: string | null;
  status: 'draft' | 'validated' | 'rejected';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  mission: {
    id: number;
    title: string;
    client: string | null;
  };
}

export function ConsultantExpenseListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Expense>> | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const columns: CustomTableColumn<Expense>[] = [
    {
      data: 'id',
      label: t('consultant.expenses.table.id') || 'ID',
      sortable: true
    },
    {
      data: 'mission_name',
      label: t('consultant.expenses.table.mission') || 'Mission',
      sortable: true
    },
    {
      data: 'month',
      label: t('consultant.expenses.table.month') || 'Month',
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
      label: t('consultant.expenses.table.year') || 'Year',
      sortable: true
    },
    {
      data: 'total_ttc',
      label: t('consultant.expenses.table.amount') || 'Amount',
      sortable: true,
      render: (value) => value ?? '0'
    },
    {
      data: 'status',
      label: t('consultant.expenses.table.status') || 'Status',
      sortable: true,
      render: (value) => {
        const statusLabels = {
          draft: t('consultant.expenses.status.draft') || 'Draft',
          validated: t('consultant.expenses.status.validated') || 'Validated',
          rejected: t('consultant.expenses.status.rejected') || 'Rejected',
          pending: t('consultant.expenses.status.pending') || 'Pending'
        };

        const statusColors = {
          draft: "bg-yellow-100 text-yellow-800",
          validated: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
          pending: "bg-blue-100 text-blue-800"
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
      label: t('consultant.expenses.table.createdAt') || 'Created At',
      sortable: true
    },
    {
      data: 'actions',
      label: t('consultant.expenses.table.actions') || 'Actions',
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/consultant/expenses/${row.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('consultant.expenses.actions.view') || 'View'}
            </TooltipContent>
          </Tooltip>

          {row.status === 'draft' && (
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
                {t('consultant.expenses.actions.delete') || 'Delete'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  const filters: CustomTableFilterConfig[] = [

    {
      field: 'month',
      label: t('consultant.expenses.filters.month') || 'Month',
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
      label: t('consultant.expenses.filters.year') || 'Year',
      type: 'select',
      options: generateYearOptions()
    },
    {
      field: 'status',
      label: t('consultant.expenses.filters.status') || 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: t('consultant.expenses.status.draft') || 'Draft' },
        { value: 'validated', label: t('consultant.expenses.status.validated') || 'Validated' },
        { value: 'rejected', label: t('consultant.expenses.status.rejected') || 'Rejected' }
      ]
    },
  ];

  const handleDelete = (id: number) => {
    setSelectedExpense(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedExpense !== null) {
      apiClient
        .delete(apiRoutes.consultant.expenses.delete(selectedExpense))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(t('consultant.expenses.delete_success') || 'Expense deleted successfully');
          if (tableInstance) {
            tableInstance.refresh?.();
          } else {
            router.refresh();
          }
        })
        .catch((error) => {
          toast.error(error.message || t('consultant.expenses.errors.delete_failed') || 'Failed to delete expense');
        });
    }
    setOpenDeleteModal(false);
  };

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
        <Heading title={t('consultant.expenses.title') || 'My Expenses'} description={t('consultant.expenses.description') || 'Manage and track your business expenses'} />
        <Link
          href="/consultant/expenses/new"
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconPlus className="mr-2 h-4 w-4" /> {t('consultant.expenses.addNew')}
        </Link>
      </div>
      <Separator />

      <CustomTable<Expense>
        columns={columns}
        url={apiRoutes.consultant.expenses.list}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />

      <CustomAlertDialog
        title={t('consultant.expenses.delete_modal.title') || 'Confirm Deletion'}
        description={t('consultant.expenses.delete_modal.description') || 'Are you sure you want to delete this expense? This action cannot be undone.'}
        cancelText={t('common.cancel') || 'Cancel'}
        confirmText={t('common.delete') || 'Delete'}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </div>
  );
}