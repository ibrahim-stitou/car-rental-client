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
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface SubcontractorInvoice {
  id: number;
  reference: string;
  company: string;
  total_amount: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  date_invoice: string;
  consultant_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
  consultant: {
    id: number;
    nom: string;
    prenom: string;
    full_name: string;
    profile_image_url: string;
    sexe_complet: null | string;
  };
  consultant_name: string;
}

export function InvoiceListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<SubcontractorInvoice>> | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const handleDelete = (id: number) => {
    setSelectedInvoiceId(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedInvoiceId !== null) {
      apiClient
        .delete(apiRoutes.admin.subcontractorInvoices.delete(selectedInvoiceId))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message || t('admin.subcontractor.invoices.deleteSuccess') || 'Invoice deleted successfully');
          if (tableInstance) {
            tableInstance.refresh?.();
          }
        })
        .catch((error) => {
          toast.error(error.message || t('admin.subcontractor.invoices.deleteError') || 'Failed to delete invoice');
        });
    }
    setOpenDeleteModal(false);
  };

  const columns: CustomTableColumn<SubcontractorInvoice>[] = [
    {
      data: 'id',
      label: t('admin.subcontractor.invoices.table.id') || 'ID',
      sortable: true
    },
    {
      data: 'reference',
      label: t('admin.subcontractor.invoices.table.reference') || 'Reference',
      sortable: true
    },
    {
      data: 'consultant_name',
      label: t('admin.subcontractor.invoices.table.consultant') || 'Consultant',
      sortable: true
    },
    {
      data: 'company',
      label: t('admin.subcontractor.invoices.table.company') || 'Company',
      sortable: true
    },
    {
      data: 'total_amount',
      label: t('admin.subcontractor.invoices.table.amount') || 'Amount',
      sortable: true,
      render: (value) => value ?? '0'
    },
    {
      data: 'status',
      label: t('admin.subcontractor.invoices.table.status') || 'Status',
      sortable: true,
      render: (value) => {
        const statusLabels = {
          pending: t('admin.subcontractor.invoices.status.pending') || 'Pending',
          validated: t('admin.subcontractor.invoices.status.validated') || 'Approved',
        };

        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
          paid: "bg-blue-100 text-blue-800"
        };

        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || ""}>
            {statusLabels[value as keyof typeof statusLabels] || value}
          </Badge>
        );
      }
    },
    {
      data: 'date_invoice',
      label: t('admin.subcontractor.invoices.table.invoiceDate') || 'Invoice Date',
      sortable: true
    },
    {
      data: 'created_at',
      label: t('admin.subcontractor.invoices.table.createdAt') || 'Created At',
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.subcontractor.invoices.table.actions') || 'Actions',
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/subcontractor-Invoice/${row.id}/show`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.subcontractor.invoices.actions.view') || 'View'}
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
              {t('admin.invoices.delete') || 'Delete'}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'reference',
      label: t('admin.subcontractor.invoices.filters.reference') || 'Reference',
      type: 'text'
    },
    {
      field: 'consultant_name',
      label: t('admin.subcontractor.invoices.filters.consultant') || 'Consultant',
      type: 'text'
    },
    {
      field: 'company',
      label: t('admin.subcontractor.invoices.filters.company') || 'Company',
      type: 'text'
    },
    {
      field: 'status',
      label: t('admin.subcontractor.invoices.filters.status') || 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: t('admin.subcontractor.invoices.status.pending') || 'Pending' },
        { value: 'validated', label: t('admin.subcontractor.invoices.status.validated') || 'Approved' },
      ]
    }
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className='flex items-start justify-between'>
        <Heading
          title={t('admin.subcontractor.invoices.title') || 'Subcontractor Invoices'}
          description={t('admin.subcontractor.invoices.subtitle') || 'View and manage subcontractor invoices'}
        />
        <Link
          href='/admin/subcontractor-Invoice/new'
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconPlus className='mr-2 h-4 w-4' /> {t('admin.subcontractor.invoices.actions.add') || 'Add Invoice'}
        </Link>
      </div>
      <Separator />

      <CustomTable<SubcontractorInvoice>
        columns={columns}
        url={apiRoutes.admin.subcontractorInvoices.list}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />

      {/* Delete Confirmation Modal */}
      <CustomAlertDialog
        title={t('admin.subcontractor.invoices.deleteModal.title') || 'Confirm Deletion'}
        description={t('admin.subcontractor.invoices.deleteModal.description') || 'Are you sure you want to delete this invoice?'}
        cancelText={t('common.cancel') || 'Cancel'}
        confirmText={t('common.delete') || 'Delete'}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </div>
  );
}