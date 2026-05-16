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
import { Button } from '@/components/ui/button';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface Client {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function ClientListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Client>> | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const handleDelete = (id: number) => {
    setSelectedClient(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedClient !== null) {
      apiClient
        .delete(apiRoutes.admin.clients.delete(selectedClient))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message || t('admin.clients.deleteSuccess') || 'Client deleted successfully!');
          if (tableInstance) {
            tableInstance.refresh?.();
          }
        })
        .catch((error) => {
          toast.error(error.message || 'Failed to delete client');
        });
    }
    setOpenDeleteModal(false);
  };

  const columns: CustomTableColumn<Client>[] = [
    {
      data: 'id',
      label: t('admin.clients.table.id') || 'ID',
      sortable: true
    },
    {
      data: 'name',
      label: t('admin.clients.table.name') || 'Name',
      sortable: true
    },
    {
      data: 'email',
      label: t('admin.clients.table.email') || 'Email',
      sortable: true
    },
    {
      data: 'status',
      label: t('admin.clients.table.status') || 'Status',
      sortable: true,
      render: (value) => {
        const statusLabels = {
          active: t('admin.clients.status.active') || 'Active',
          pending: t('admin.clients.status.pending') || 'Pending',
          inactive: t('admin.clients.status.inactive') || 'Inactive'
        };

        const statusColors = {
          active: "bg-green-100 text-green-800",
          pending: "bg-yellow-100 text-yellow-800",
          inactive: "bg-red-100 text-red-800"
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
      label: t('admin.clients.table.created_at') || 'Created At',
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.clients.table.actions') || 'Actions',
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/clients/${row.id}/show`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.clients.view_details') || 'View Details'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/clients/${row.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.clients.edit_') || 'Edit'}
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
              {t('admin.clients.delete') || 'Delete'}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'name',
      label: t('admin.clients.filters.name') || 'Name',
      type: 'text'
    },
    {
      field: 'email',
      label: t('admin.clients.filters.email') || 'Email',
      type: 'text'
    },
    {
      field: 'status',
      label: t('admin.clients.filters.status') || 'Status',
      type: 'select',
      options: [
        { value: 'active', label: t('admin.clients.status.active') || 'Active' },
        { value: 'inactive', label: t('admin.clients.status.inactive') || 'Inactive' }
      ]
    }
  ];

  return (
    <>
      <CustomTable<Client>
        columns={columns}
        url={apiRoutes.admin.clients.list}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />
      <CustomAlertDialog
        title={t('admin.clients.deleteModal.title') || 'Delete Client'}
        description={t('admin.clients.deleteModal.description') || 'Are you sure you want to delete this client?'}
        cancelText={t('common.cancel') || 'Cancel'}
        confirmText={t('common.delete') || 'Delete'}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </>
  );
}