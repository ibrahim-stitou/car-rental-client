import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trash2, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PATHS } from '@/config/paths';
import { useLanguage } from '@/context/LanguageContext';
import {
  CustomTableColumn,
  CustomTableFilterConfig,
  UseTableReturn
} from '@/components/custom/data-table/types';
import CustomTable from '@/components/custom/data-table/custom-table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { CreateExpenseModal } from '@/features/consultant/rechargeable-expenses/create-modal';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';

interface ConsultantExpense {
  id: number;
  mission_id: number;
  year: string;
  month: number;
  status: string;
  consultant_id: number;
  total_amount: string;
  created_at: string;
  updated_at: string;
  mission: {
    id: number;
    title: string;
  };
}

const RechargeableExpenses = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedExpense, setSelectedExpense] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [tableInstance, setTableInstance] = useState<Partial<
    UseTableReturn<ConsultantExpense>
  > | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'review':
        return 'bg-amber-100 text-amber-800';
      case 'validated':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'corrected':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: CustomTableColumn<ConsultantExpense>[] = [
    {
      data: 'id',
      label: t('consultant.rechargeable_expenses.table.id'),
      sortable: true
    },
    {
      data: 'mission',
      label: t('consultant.rechargeable_expenses.table.mission'),
      sortable: true,
      render(value) {
        return (
          <Button variant='link' asChild className='p-0'>
            <Link href={`/consultant/missions/${value.id}/show`}>
              {value.title}
            </Link>
          </Button>
        );
      }
    },
    {
      data: 'month',
      label: t('consultant.rechargeable_expenses.table.month'),
      sortable: true,
      render(value) {
        return t(`months.${value}`);
      }
    },
    {
      data: 'year',
      label: t('consultant.rechargeable_expenses.table.year'),
      sortable: true
    },

    {
      data: 'total_amount',
      label: t('consultant.rechargeable_expenses.table.amount'),
      sortable: true,
      render(value) {
        return value ?? '0';
      }
    },

    {
      data: 'status',
      label: t('consultant.rechargeable_expenses.table.status'),
      sortable: true,
      render(value) {
        const statusLabel = t(
          `consultant.rechargeable_expenses.status.${value}`
        );
        return (
          <Badge className={`${getStatusColor(value)} font-medium`}>
            {statusLabel}
          </Badge>
        );
      }
    },
    {
      data: 'created_at',
      label: t('consultant.rechargeable_expenses.table.created_at'),
      sortable: true
    },
    {
      data: 'actions',
      label: t('consultant.rechargeable_expenses.table.actions'),
      sortable: false,
      render: (value, row) => {
        return (
          <div className='flex items-center space-x-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  className='h-8 w-8 bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100'
                  onClick={() => handleView(row.id)}
                >
                  <Eye className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className='tooltip-content rounded-md bg-blue-50 px-2 py-1 text-blue-600 shadow-md'
                sideOffset={5}
              >
                {t('consultant.rechargeable_expenses.view')}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      }
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'year',
      defaultValue: null,
      type: 'number',
      label: t('consultant.rechargeable_expenses.filters.year')
    },
    {
      field: 'status',
      defaultValue: null,
      label: t('consultant.rechargeable_expenses.filters.status'),
      type: 'select',
      options: [
        {
          value: 'draft',
          label: t('consultant.rechargeable_expenses.status.draft')
        },
        {
          value: 'review',
          label: t('consultant.rechargeable_expenses.status.review')
        },
        {
          value: 'validated',
          label: t('consultant.rechargeable_expenses.status.validated')
        },
        {
          value: 'rejected',
          label: t('consultant.rechargeable_expenses.status.rejected')
        }
      ]
    }
  ];

  const handleDelete = (id: number) => {
    setSelectedExpense(id);
    setOpenDeleteModal(true);
  };

  const handleView = (id: number) => {
    router.push(`${PATHS.consultant.rechargeable_expenses.base.link}/${id}`);
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={t('consultant.rechargeable_expenses.title')}
            description={t('consultant.rechargeable_expenses.description')}
          />
          <CreateExpenseModal>
            <button className={cn(buttonVariants(), 'text-xs md:text-sm')}>
              <IconPlus className='mr-2 h-4 w-4' />{' '}
              {t('consultant.rechargeable_expenses.create.title')}
            </button>
          </CreateExpenseModal>
        </div>
        <Separator />
        <CustomTable<ConsultantExpense>
          columns={columns}
          url={apiRoutes.consultant.rechargeableExpenses.list}
          filters={filters}
          onInit={(tableInstance) => setTableInstance(tableInstance)}
        />
      </div>
    </PageContainer>
  );
};

export default RechargeableExpenses;
