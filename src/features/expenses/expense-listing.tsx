'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import CustomTable from '@/components/custom/data-table/custom-table';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { apiRoutes } from '@/config/apiRoutes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

interface Expense {
  id: number;
  description: string;
  amount: number;
  expense_date: string;
  status: string;
  consultant: { id: number; full_name: string };
  consultant_name: string;
  mission: { id: number; title: string };
  mission_title: string;
  created_at: string;
  month: number;
  year: number;
}

export function ExpenseListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Expense>> | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const handleDelete = (id: number) => {
    setSelectedExpense(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedExpense !== null) {
      apiClient
        .delete(apiRoutes.admin.expenses.delete(selectedExpense))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message || t('admin.expenses.deleteSuccess'));
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

  const columns: CustomTableColumn<Expense>[] = [
    {
      data: 'id',
      label: t('admin.expenses.table.id'),
      sortable: true
    },
    {
      data: 'total_ttc',
      label: t('admin.expenses.table.amount'),
      sortable: true,
      render: (value) => (
        <span>{parseFloat(value ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
      )
    },
    {
      data: 'consultant_name',
      label: t('admin.expenses.table.consultant'),
      sortable: true
    },
    {
      data: 'mission_title',
      label: t('admin.expenses.table.mission'),
      sortable: true
    },
    {
      data: 'month',
      label: t('admin.expenses.table.month'),
      sortable: true,
      render: (value) => {
        return t(`months.${value}`);
      }
    },
    {
      data: 'year',
      label: t('admin.expenses.table.year'),
      sortable: true
    },
    {
      data: 'status',
      label: t('admin.expenses.table.status'),
      sortable: true,
      render: (value) => {
        const statusLabels = {
          approved: t('admin.expenses.status.approved'),
          pending: t('admin.expenses.status.pending'),
          rejected: t('admin.expenses.status.rejected')
        };

        const statusColors = {
          approved: "bg-green-100 text-green-800",
          pending: "bg-yellow-100 text-yellow-800",
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
      data: 'created_at',
      label: t('admin.expenses.table.created_at'),
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.expenses.table.actions'),
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/expenses/${row.id}/show`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.expenses.view_details')}
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
              {t('admin.expenses.delete')}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  // Create an array of month options for filter
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: t(`months.${i + 1}`)
  }));

  // Create year options (current year and previous 4 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i)
  }));

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'mission_title',
      label: t('admin.expenses.filters.mission'),
      type: 'text'
    },
    {
      field: 'consultant_name',
      label: t('admin.expenses.filters.consultant'),
      type: 'text'
    },
    {
      field: 'month',
      label: t('admin.expenses.filters.month'),
      type: 'select',
      options: monthOptions
    },
    {
      field: 'year',
      label: t('admin.expenses.filters.year'),
      type: 'select',
      options: yearOptions
    },
    {
      field: 'status',
      label: t('admin.expenses.filters.status'),
      type: 'select',
      options: [
        { value: 'approved', label: t('admin.expenses.status.approved') },
        { value: 'pending', label: t('admin.expenses.status.pending') },
        { value: 'rejected', label: t('admin.expenses.status.rejected') }
      ]
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading title={t('admin.expenses.title')} description={t('admin.expenses.description')} />
        </div>
        <Separator />
        <CustomTable<Expense>
          columns={columns}
          url={apiRoutes.admin.expenses.list}
          filters={filters}
          onInit={(instance) => setTableInstance(instance)}
        />
        <CustomAlertDialog
          title={t('admin.expenses.deleteModal.title')}
          description={t('admin.expenses.deleteModal.description')}
          cancelText={t('common.cancel')}
          confirmText={t('common.delete')}
          onConfirm={handleConfirmDelete}
          open={openDeleteModal}
          setOpen={setOpenDeleteModal}
        />
      </div>
      );
      }