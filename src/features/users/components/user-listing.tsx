'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import CustomTable from '@/components/custom/data-table/custom-table';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { apiRoutes } from '@/config/apiRoutes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  status: string;
  role: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export function UserListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<User>> | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const handleDelete = (id: number) => {
    setSelectedUser(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUser !== null) {
      apiClient
        .delete(apiRoutes.admin.users.delete(selectedUser))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message || t('admin.users.deleteSuccess'));
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

  const columns: CustomTableColumn<User>[] = [
    {
      data: 'id',
      label: t('admin.users.table.id'),
      sortable: true
    },
    {
      data: 'firstname',
      label: t('admin.users.table.firstname'),
      sortable: true
    },
    {
      data: 'lastname',
      label: t('admin.users.table.lastname'),
      sortable: true
    },
    {
      data: 'email',
      label: t('admin.users.table.email'),
      sortable: true
    },
    {
      data: 'status',
      label: t('admin.users.table.status'),
      sortable: true,
      render: (value) => {
        const statusLabels = {
          active: t('admin.users.status.active'),
          inactive: t('admin.users.status.inactive'),
          suspended: t('admin.users.status.suspended')
        };

        const statusColors = {
          active: "bg-green-100 text-green-800",
          inactive: "bg-red-100 text-red-800"
        };

        return (
          <Badge className={
            //@ts-ignore
            statusColors[value] || ""
          }>
            {/*//@ts-ignore*/}
            {statusLabels[value] || value}
          </Badge>
        );
      }
    },
    {
      data: 'role',
      label: t('admin.users.table.role'),
      sortable: true
    },
    {
      data: 'created_at',
      label: t('admin.users.table.created_at'),
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.users.table.actions'),
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/users/${row.id}/show`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.users.view_details')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/users/${row.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.users.edit.title')}
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
              {t('admin.users.delete')}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'firstname',
      label: t('admin.users.filters.firstname'),
      type: 'text'
    },
    {
      field: 'lastname',
      label: t('admin.users.filters.lastname'),
      type: 'text'
    },
    {
      field: 'email',
      label: t('admin.users.filters.email'),
      type: 'text'
    },
    {
      field: 'status',
      label: t('admin.users.filters.status'),
      type: 'select',
      options: [
        { value: 'active', label: t('admin.users.status.active') },
        { value: 'inactive', label: t('admin.users.status.inactive') }
      ]
    },
    {
      field: 'role',
      label: t('admin.users.filters.role'),
      type: 'select',
      options: [
        { value: 'Administrateur', label: t('admin.users.roles.admin') },
        { value: 'Consultant', label: t('admin.users.roles.consultant') },
      ]
    }
  ];

  return (
    <>
      <CustomTable<User>
        columns={columns}
        url={apiRoutes.admin.users.list}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />
      <CustomAlertDialog
        title={t('admin.users.deleteModal.title')}
        description={t('admin.users.deleteModal.description')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </>
  );
}