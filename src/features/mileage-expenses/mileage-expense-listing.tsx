'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import CustomTable from '@/components/custom/data-table/custom-table';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { apiRoutes } from '@/config/apiRoutes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Trash2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

interface MileageExpense {
  id: number;
  consultant_id: number;
  mission_id: number;
  amount_ttc: string;
  total_km: number;
  status: string;
  month: number;
  year: number;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  consultant: {
    id: number;
    nom: string;
    prenom: string;
    full_name: string;
  };
  consultant_name: string;
}

export function MileageExpenseListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<MileageExpense>> | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openValidateModal, setOpenValidateModal] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);

  const handleDelete = (id: number) => {
    setSelectedExpenseId(id);
    setOpenDeleteModal(true);
  };

  const handleValidate = (id: number) => {
    setSelectedExpenseId(id);
    setOpenValidateModal(true);
  };

  const handleReject = (id: number) => {
    setSelectedExpenseId(id);
    setOpenRejectModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedExpenseId !== null) {
      apiClient
        .delete(apiRoutes.admin.mileageExpenses.delete(selectedExpenseId))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message || t('admin.mileageExpenses.deleteSuccess'));
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

  const handleConfirmValidate = () => {
    if (selectedExpenseId !== null) {
      apiClient
        .post(apiRoutes.admin.mileageExpenses.approve(selectedExpenseId))
        .then((response) => {
          setOpenValidateModal(false);
          toast.success(response.data.message || t('admin.mileageExpenses.validateSuccess'));
          if (tableInstance) {
            tableInstance.refresh?.();
          }
        })
        .catch((error) => {
          toast.error(error.message);
        });
    }
    setOpenValidateModal(false);
  };

  const handleConfirmReject = () => {
    if (selectedExpenseId !== null) {
      apiClient
        .post(apiRoutes.admin.mileageExpenses.reject(selectedExpenseId))
        .then((response) => {
          setOpenRejectModal(false);
          toast.success(response.data.message || t('admin.mileageExpenses.rejectSuccess'));
          if (tableInstance) {
            tableInstance.refresh?.();
          }
        })
        .catch((error) => {
          toast.error(error.message);
        });
    }
    setOpenRejectModal(false);
  };

  const columns: CustomTableColumn<MileageExpense>[] = [
    {
      data: 'id',
      label: t('admin.mileageExpenses.table.id') || 'ID',
      sortable: true
    },
    {
      data: 'consultant_name',
      label: t('admin.mileageExpenses.table.consultant') || 'Consultant',
      sortable: true
    },
    {
      data: 'amount_ttc',
      label: t('admin.mileageExpenses.table.amount') || 'Amount',
      sortable: true,
      render: (value) => (
        <span>{parseFloat(value ?? '0').toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
      )
    },
    {
      data: 'total_km',
      label: t('admin.mileageExpenses.table.totalKm') || 'Total KM',
      sortable: true,
      render: (value) => (
        <span>{value ?? 0} km</span>
      )
    },
    {
      data: 'month',
      label: t('admin.mileageExpenses.table.month') || 'Month',
      sortable: true,
      render: (value) => {
        return t(`months.${value}`) || `Month ${value}`;
      }
    },
    {
      data: 'year',
      label: t('admin.mileageExpenses.table.year') || 'Year',
      sortable: true
    },
    {
      data: 'status',
      label: t('admin.mileageExpenses.table.status') || 'Status',
      sortable: true,
      render: (value) => {
        const statusLabels = {
          validated: t('admin.mileageExpenses.status.validated') || 'Validated',
          to_sign: t('admin.mileageExpenses.status.toSign') || 'To Sign',
          rejected: t('admin.mileageExpenses.status.rejected') || 'Rejected',
          pending: t('admin.mileageExpenses.status.pending') || 'Pending'
        };

        const statusColors = {
          validated: "bg-green-100 text-green-800",
          to_sign: "bg-blue-100 text-blue-800",
          rejected: "bg-red-100 text-red-800",
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
      data: 'created_at',
      label: t('admin.mileageExpenses.table.createdAt') || 'Created At',
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.mileageExpenses.table.actions') || 'Actions',
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/mileage-expenses/${row.id}/show`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.mileageExpenses.view') || 'View Details'}
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
              {t('admin.mileageExpenses.delete') || 'Delete'}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  // Create month options for filter
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: t(`months.${i + 1}`) || `Month ${i + 1}`
  }));

  // Create year options (current year and previous 4 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i)
  }));

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'consultant_name',
      label: t('admin.mileageExpenses.filters.consultant') || 'Consultant',
      type: 'text'
    },
    {
      field: 'month',
      label: t('admin.mileageExpenses.filters.month') || 'Month',
      type: 'select',
      options: monthOptions
    },
    {
      field: 'year',
      label: t('admin.mileageExpenses.filters.year') || 'Year',
      type: 'select',
      options: yearOptions
    },
    {
      field: 'status',
      label: t('admin.mileageExpenses.filters.status') || 'Status',
      type: 'select',
      options: [
        { value: 'validated', label: t('admin.mileageExpenses.status.validated') || 'Validated' },
        { value: 'to_sign', label: t('admin.mileageExpenses.status.toSign') || 'To Sign' },
        { value: 'rejected', label: t('admin.mileageExpenses.status.rejected') || 'Rejected' },
        { value: 'pending', label: t('admin.mileageExpenses.status.pending') || 'Pending' }
      ]
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className='flex items-start justify-between'>
        <Heading
          title={t('admin.mileageExpenses.title') || 'Mileage Expenses'}
          description={t('admin.mileageExpenses.description') || 'Manage all mileage expense reports'}
        />
      </div>
      <Separator />
      <CustomTable<MileageExpense>
        columns={columns}
        url={apiRoutes.admin.mileageExpenses.list}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />

      {/* Delete Confirmation Modal */}
      <CustomAlertDialog
        title={t('admin.mileageExpenses.deleteModal.title') || 'Confirm Deletion'}
        description={t('admin.mileageExpenses.deleteModal.description') || 'Are you sure you want to delete this mileage expense?'}
        cancelText={t('common.cancel') || 'Cancel'}
        confirmText={t('common.delete') || 'Delete'}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </div>
  );
}