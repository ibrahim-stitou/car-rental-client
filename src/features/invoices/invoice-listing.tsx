'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import CustomTable from '@/components/custom/data-table/custom-table';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { apiRoutes } from '@/config/apiRoutes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Trash2, Download, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';

interface Invoice {
  id: number;
  reference: string | null;
  client_id: number;
  objet: string;
  date: string;
  date_echenace: string;
  total_ht: string;
  total_ttc: string;
  status: 'validated' | 'draft';
  status_paiement: 'paid' | 'unpaid';
  nombre_denvoie: number;
  mission_id: number | null;
  consultant_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  client: {
    id: number;
    name: string;
  };
  client_name: string;
  mission_title: string;
  media?: Array<{
    id: number;
    original_url: string;
    file_name: string;
  }>;
}

export function InvoiceListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Invoice>> | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openSendModal, setOpenSendModal] = useState(false);

  const handleDelete = (id: number) => {
    setSelectedInvoiceId(id);
    setOpenDeleteModal(true);
  };

  const handleSend = (id: number) => {
    setSelectedInvoiceId(id);
    setOpenSendModal(true);
  };


  const handleDownload = (id: number, row: Invoice) => {
    const InvoiceDocument= row.media?.find(
      //@ts-ignore
      (m) => m.collection_name === "invoice_document"
    );
    if (InvoiceDocument) {
      window.open(InvoiceDocument.original_url, '_blank');
    } else {
      toast.info(t('admin.invoices.noFileToDownload') || 'No file available for download');
    }
  };

  const handleConfirmDelete = () => {
    if (selectedInvoiceId !== null) {
      apiClient
        .delete(apiRoutes.admin.invoices.delete(selectedInvoiceId))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message || t('admin.invoices.deleteSuccess'));
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

  const handleConfirmSend = () => {
    if (selectedInvoiceId !== null) {
      apiClient
        .post(apiRoutes.admin.invoices.send(selectedInvoiceId))
        .then((response) => {
          setOpenSendModal(false);
          toast.success(response.data.message || t('admin.invoices.sendSuccess'));
          if (tableInstance) {
            tableInstance.refresh?.();
          }
        })
        .catch((error) => {
          toast.error(error.message);
        });
    }
    setOpenSendModal(false);
  };


  const columns: CustomTableColumn<Invoice>[] = [
    {
      data: 'id',
      label: t('admin.invoices.table.id') || 'ID',
      sortable: true
    },
    {
      data: 'reference',
      label: t('admin.invoices.table.reference') || 'Reference',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      data: 'client_name',
      label: t('admin.invoices.table.client') || 'Client',
      sortable: true
    },
    {
    data: 'objet',
      label: t('admin.invoices.table.object') || 'Object',
      sortable: true
    },
    {
      data: 'date',
      label: t('admin.invoices.table.date') || 'Date',
      sortable: true
    },
    {
      data: 'date_echenace',
      label: t('admin.invoices.table.dueDate') || 'Due Date',
      sortable: true
    },
    {
      data: 'total_ht',
      label: t('admin.invoices.table.totalHt') || 'Total HT',
      sortable: true,
      render: (value) => (
        <span>{parseFloat(value ?? '0').toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
      )
    },
    {
      data: 'total_ttc',
      label: t('admin.invoices.table.totalTtc') || 'Total TTC',
      sortable: true,
      render: (value) => (
        <span>{parseFloat(value ?? '0').toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
      )
    },
    {
      data: 'status',
      label: t('admin.invoices.table.status') || 'Status',
      sortable: true,
      render: (value) => {
        const statusLabels = {
          validated: t('admin.invoices.status.validated') || 'Validated',
          draft: t('admin.invoices.status.draft') || 'Draft'
        };

        const statusColors = {
          validated: "bg-green-100 text-green-800",
          draft: "bg-yellow-100 text-yellow-800"
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
      data: 'status_paiement',
      label: t('admin.invoices.table.paymentStatus') || 'Payment Status',
      sortable: true,
      render: (value) => {
        const statusLabels = {
          paid: t('admin.invoices.paymentStatus.paid') || 'Paid',
          unpaid: t('admin.invoices.paymentStatus.unpaid') || 'Unpaid'
        };

        const statusColors = {
          paid: "bg-green-100 text-green-800",
          unpaid: "bg-red-100 text-red-800"
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
      data: 'nombre_denvoie',
      label: t('admin.invoices.table.sentCount') || 'Sent Count',
      sortable: true
    },
    {
      data: 'created_at',
      label: t('admin.invoices.table.createdAt') || 'Created At',
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.invoices.table.actions') || 'Actions',
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/invoices/${row.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.invoices.view') || 'View Details'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => handleDownload(row.id, row)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.invoices.download') || 'Download'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => handleSend(row.id)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.invoices.send') || 'Send'}
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
      label: t('admin.invoices.filters.reference') || 'Reference',
      type: 'text'
    },
    {
      field: 'client_name',
      label: t('admin.invoices.filters.client') || 'Client',
      type: 'text'
    },
    {
      field: 'status',
      label: t('admin.invoices.filters.status') || 'Status',
      type: 'select',
      options: [
        { value: 'validated', label: t('admin.invoices.status.validated') || 'Validated' },
        { value: 'draft', label: t('admin.invoices.status.draft') || 'Draft' }
      ]
    },
    {
      field: 'status_paiement',
      label: t('admin.invoices.filters.paymentStatus') || 'Payment Status',
      type: 'select',
      options: [
        { value: 'paid', label: t('admin.invoices.paymentStatus.paid') || 'Paid' },
        { value: 'unpaid', label: t('admin.invoices.paymentStatus.unpaid') || 'Unpaid' }
      ]
    }
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className='flex items-start justify-between'>
        <Heading
        title={t('admin.invoices.headingTitle') || 'Invoices'}
        description={t('admin.invoices.headingDescription') || 'Manage all client invoices'}
        />
        <Link
          href="/admin/invoices/new"
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconPlus className="mr-2 h-4 w-4" />{t('admin.invoices.addInvoice') || 'Add Invoice'}
        </Link>
      </div>
      <Separator />
      <CustomTable<Invoice>
        columns={columns}
        url={apiRoutes.admin.invoices.list}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />

      {/* Delete Confirmation Modal */}
      <CustomAlertDialog
        title={t('admin.invoices.deleteModal.title') || 'Confirm Deletion'}
        description={t('admin.invoices.deleteModal.description') || 'Are you sure you want to delete this invoice?'}
        cancelText={t('common.cancel') || 'Cancel'}
        confirmText={t('common.delete') || 'Delete'}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />

      {/* Send Confirmation Modal */}
      <CustomAlertDialog
        title={t('admin.invoices.sendModal.title') || 'Confirm Sending'}
        description={t('admin.invoices.sendModal.description') || 'Are you sure you want to send this invoice?'}
        cancelText={t('common.cancel') || 'Cancel'}
        confirmText={t('common.send') || 'Send'}
        onConfirm={handleConfirmSend}
        open={openSendModal}
        setOpen={setOpenSendModal}
      />
    </div>
  );
}