import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trash2, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PATHS } from '@/config/paths';
import { useLanguage } from '@/context/LanguageContext';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { buttonVariants } from '@/components/ui/button';
import CustomTable from '@/components/custom/data-table/custom-table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { IconPlus } from '@tabler/icons-react';
import { apiRoutes } from '@/config/apiRoutes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { CreateExpenseModal } from '@/features/consultant/rechargeable-expenses/create-modal';

interface RechargeableExpense {
  id: number;
  mission_id: {
    id:number;
    title:string;
  };
  year: string;
  month: number;
  status: string;
  consultant_id: {
    id: number;
    name: string;
  };
  total_amount: string;
  created_at: string;
  updated_at: string;
}

const RechargeableExpense = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedExpense, setSelectedExpense] = useState<number|null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<RechargeableExpense>>|null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En révision':
        return 'bg-amber-100 text-amber-800';
      case 'Approuvé':
        return 'bg-green-100 text-green-800';
      case 'Refusé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: CustomTableColumn<RechargeableExpense>[] = [
    {
      data: 'id',
      label: t('admin.rechargeable_expenses.table.id'),
      sortable: true
    },
    {
      data: 'consultant_id',
      label: t('admin.rechargeable_expenses.table.consultant'),
      sortable: true,
      render(value, row) {
        return (
          <Button variant="link" asChild className="p-0">
            <Link href={`/admin/users/${value.id}`}>
              {value.name}
            </Link>
          </Button>
        );
      }
    },
    {
      data: 'mission',
      label: t('admin.rechargeable_expenses.table.mission'),
      sortable: true,
      render(value, row) {
        return (
          <Button variant="link" asChild className="p-0">
            <Link href={`/admin/missions/${value.id}/show`}>
              {value.title}
            </Link>
          </Button>
        );
      }
    },
    {
      data: 'month',
      label: t('admin.rechargeable_expenses.table.month'),
      sortable: true,
      render(value, row) {
        return t(`months.${value}`);
      }
    },
    {
      data: 'year',
      label: t('admin.rechargeable_expenses.table.year'),
      sortable: true
    },
    {
      data: 'total_amount',
      label: t('admin.rechargeable_expenses.table.amount'),
      sortable: true,
      render: (value) => value ?? '0'
    },
    {
      data: 'status',
      label: t('admin.rechargeable_expenses.table.status'),
      sortable: true,
      render(value, row) {
        return (
          <Badge className={`${getStatusColor(value)} font-medium`}>
            {value}
          </Badge>
        );
      }
    },
    {
      data: 'created_at',
      label: t('admin.rechargeable_expenses.table.created_at'),
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.rechargeable_expenses.table.actions'),
      sortable: false,
      render: (value, row) => {
        return (
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-1.5"
                  onClick={() => handleView(row.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-blue-50 text-blue-600 rounded-md px-2 py-1 shadow-md tooltip-content"
                sideOffset={5}
              >
                {t('admin.rechargeable_expenses.view')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 h-8 w-8"
                  onClick={() => handleDelete(row.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-red-100 text-red-600 rounded-md px-2 py-1 shadow-md tooltip-content"
                sideOffset={5}
              >
                {t('admin.rechargeable_expenses.delete')}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      }
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'consultant',
      defaultValue: null,
      type:'text',
      label: t('admin.rechargeable_expenses.filters.consultant'),
    },
    {
      field: 'year',
      defaultValue: null,
      type:'number',
      label: t('admin.rechargeable_expenses.filters.year'),
    },
    {
      field: 'mission',
      defaultValue: null,
      type:'text',
      label: t('admin.rechargeable_expenses.filters.mission'),
    },
    {
      field: 'status',
      defaultValue: null,
      label: t('admin.rechargeable_expenses.filters.status'),
      type: 'select',
      options: [
        { value: 'review', label: t('admin.rechargeable_expenses.status.review') },
        { value: 'validated', label: t('admin.rechargeable_expenses.status.approved') },
        { value: 'rejected', label: t('admin.rechargeable_expenses.status.declined') }
      ]
    },
  ];

  const handleDelete = (id: number) => {
    setSelectedExpense(id);
    setOpenDeleteModal(true);
  };

  const handleView = (id: number) => {
    router.push(`${PATHS.admin.rechargeable_expenses.base.link}/${id}`);
  };

  const handleConfirmDelete = () => {
    if (selectedExpense !== null) {
      apiClient.delete(apiRoutes.admin.rechargeableExpenses.delete(selectedExpense))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message);
          if (tableInstance) {
            tableInstance.refresh?.();
          } else {
            router.push(PATHS.admin.rechargeable_expenses.list.link);
          }
        })
        .catch((error) => {
          toast.error(error.message);
        });
    }
    setOpenDeleteModal(false);
  };

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={t('admin.rechargeable_expenses.title')}
            description={t('admin.rechargeable_expenses.description')}
          />
        </div>
        <Separator />
        <CustomTable<RechargeableExpense>
          columns={columns}
          url={apiRoutes.admin.rechargeableExpenses.list}
          filters={filters}
          onInit={(tableInstance) => setTableInstance(tableInstance)}
        />
      </div>
      <CustomAlertDialog
        title={t('admin.rechargeable_expenses.deleteModal.title')}
        description={t('admin.rechargeable_expenses.deleteModal.description')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </PageContainer>
  );
};

export default RechargeableExpense;