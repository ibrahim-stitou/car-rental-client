'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import CustomTable from '@/components/custom/data-table/custom-table';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { apiRoutes } from '@/config/apiRoutes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Trash2, Edit, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

interface Contract {
  id: number;
  reference: string;
  start_at: string;
  end_at: string;
  status: string;
  raw_status: string;
  contract_type: string;
  raw_contract_type: string;
  fees_amount: string;
  management_fees: string;
  consultant: { id: number; full_name: string };
  consultant_name: string;
  created_at: string;
  updated_at: string;
}

export function ContractListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Contract>> | null>(null);
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const handleDelete = (id: number) => {
    setSelectedContract(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedContract !== null) {
      apiClient
        .delete(apiRoutes.admin.contracts.delete(selectedContract))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message || t('admin.contracts.deleteSuccess'));
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

  const columns: CustomTableColumn<Contract>[] = [
    {
      data: 'id',
      label: t('admin.contracts.table.id'),
      sortable: true
    },
    {
      data: 'reference',
      label: t('admin.contracts.table.reference'),
      sortable: true
    },
    {
      data: 'consultant_name',
      label: t('admin.contracts.table.consultant'),
      sortable: true,
      render: (value, row) => (
        <Button variant='link' asChild>
          <Link href={'/admin/users/' + row.consultant.id + '/show'}>{value}</Link>
        </Button>
      )
    },
    {
      data: 'contract_type',
      label: t('admin.contracts.table.contractType'),
      sortable: true,
      render: (value) => {
        const contractTypeLabels = {
          cdi: t('admin.contracts.types.cdi'),
          cdd: t('admin.contracts.types.cdd'),
          contractor: t('admin.contracts.types.contractor')
        };
//@ts-ignore
        return contractTypeLabels[value] || value;
      }
    },
    {
      data: 'fees_amount',
      label: t('admin.contracts.table.feesAmount'),
      sortable: true,
      render: (value) => value ?? '0'
    },
    {
      data: 'start_at',
      label: t('admin.contracts.table.startDate'),
      sortable: true
    },
    {
      data: 'end_at',
      label: t('admin.contracts.table.endDate'),
      sortable: true
    },
    {
      data: 'status',
      label: t('admin.contracts.table.status'),
      sortable: true,
      render: (value, row) => {
        const statusLabels = {
          in_progress: t('admin.contracts.status.inProgress'),
          planned: t('admin.contracts.status.completed'),
          terminated: t('admin.contracts.status.terminated')
        };

        const statusColors = {
          in_progress: "bg-green-100 text-green-800",
          planned: "bg-blue-100 text-blue-800",
          terminated: "bg-red-100 text-red-800"
        };

        return (
          <Badge className={
            //@ts-ignore
            statusColors[row.raw_status] || ""}>{statusLabels[row.raw_status] || value}
          </Badge>
        );
      }
    },
    {
      data: 'created_at',
      label: t('admin.contracts.table.created_at'),
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.contracts.table.actions'),
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/contracts/${row.id}/show`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.contracts.view_details')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/admin/contracts/${row.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.contracts.edit_')}
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
              {t('admin.contracts.delete')}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'reference',
      label: t('admin.contracts.filters.reference'),
      type: 'text'
    },
    {
      field: 'consultant_name',
      label: t('admin.contracts.filters.consultant'),
      type: 'text'
    },
    {
      field: 'contract_type',
      label: t('admin.contracts.filters.contractType'),
      type: 'select',
      options: [
        { value: 'cdi', label: t('admin.contracts.types.cdi') },
        { value: 'cdd', label: t('admin.contracts.types.cdd') },
        { value: 'contractor', label: t('admin.contracts.types.contractor') }
      ]
    },
    {
      field: 'status',
      label: t('admin.contracts.filters.status'),
      type: 'select',
      options: [
        { value: 'in_progress', label: t('admin.contracts.status.inProgress') },
        { value: 'planned', label: t('admin.contracts.status.completed') },
        { value: 'terminated', label: t('admin.contracts.status.terminated') }
      ]
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading
          title={t('admin.contracts.title')}
          description={t('admin.contracts.description')}
        />
        <Button
          onClick={() => router.push('/admin/contracts/new')}
          className="text-xs md:text-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> {t('admin.contracts.addNew')}
        </Button>
      </div>
      <Separator />
      <CustomTable<Contract>
        columns={columns}
        url={apiRoutes.admin.contracts.list}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />
      <CustomAlertDialog
        title={t('admin.contracts.deleteModal.title')}
        description={t('admin.contracts.deleteModal.description')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </div>
  );
}