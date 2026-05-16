import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { Play, Eye, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
import { apiRoutes } from '@/config/apiRoutes';
import { useRouter } from 'next/navigation';
interface ConsultantDetail {
  amount: string;
  contract_id: number;
  consultant_id: number;
  consultant_name: string;
  contract_reference: string | null;
}

interface FlatFeeGeneration {
  id: number;
  month: string;
  year: number;
  generated_count: number;
  total_count: number;
  total_amount: string;
  consultant_details: ConsultantDetail[];
  generated_by: number;
  last_generation_date: string;
  created_at: string;
  updated_at: string;
  consultants_count: number | null;
}

const FlatFeesListView = () => {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<
    UseTableReturn<FlatFeeGeneration>
  > | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<FlatFeeGeneration | null>(null);
  const [openConsultantsDialog, setOpenConsultantsDialog] = useState(false);

  const columns: CustomTableColumn<FlatFeeGeneration>[] = [
    {
      data: 'id',
      label: t('admin.flat-fees.table.id'),
      sortable: true
    },
    {
      data: 'month',
      label: t('admin.flat-fees.table.month'),
      sortable: true
    },
    {
      data: 'year',
      label: t('admin.flat-fees.table.year'),
      sortable: true
    },
    {
      data: 'total_amount',
      label: t('admin.flat-fees.table.total_amount'),
      sortable: true,
      render: (value) => value ?? '0'
    },
    {
      data: 'generated_count',
      label: t('admin.flat-fees.table.generated_count'),
      sortable: true,
      render: (value, row) => (
        <div className='flex items-center space-x-2'>
          {value}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={() => {
                  setSelectedGeneration(row);
                  setOpenConsultantsDialog(true);
                }}
              >
                <Users className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.flat-fees.view_consultants')}
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
    {
      data: 'created_at',
      label: t('admin.flat-fees.table.generated_at'),
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.flat-fees.table.actions'),
      sortable: false,
      render: (_value, row) => {
        return (
          <div className='flex items-center space-x-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-1.5'
                  onClick={() => router.push(`/admin/action-system/${row.id}`)}
                >
                  <Eye className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className='tooltip-content rounded-md bg-gray-100 px-2 py-1 text-gray-600 shadow-md'
                sideOffset={5}
              >
                {t('admin.flat-fees.view_details')}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      }
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'month',
      label: t('admin.flat-fees.filters.month'),
      type: 'select',
      options: [
        { value: '1', label: t('months.1') },
        { value: '2', label: t('months.2') },
        { value: '3', label: t('months.3') },
        { value: '4', label: t('months.4') },
        { value: '5', label: t('months.5') },
        { value: '6', label: t('months.6') },
        { value: '7', label: t('months.7') },
        { value: '8', label: t('months.8') },
        { value: '9', label: t('months.9') },
        { value: '10', label: t('months.10') },
        { value: '11', label: t('months.11') },
        { value: '12', label: t('months.12') }
      ]
    },
    {
      field: 'year',
      label: t('admin.flat-fees.filters.year'),
      type: 'number',
    }
  ];

  const handleGenerateFlatFees = () => {
    router.push('/admin/action-system/generate');
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={t('admin.flat-fees.title')}
            description={t('admin.flat-fees.description')}
          />
          <div className='flex space-x-2'>
            <Button onClick={handleGenerateFlatFees}>
              <Play className='mr-2 h-4 w-4' /> {t('admin.flat-fees.generate_')}
            </Button>
          </div>
        </div>
        <Separator />
        <CustomTable<FlatFeeGeneration>
          columns={columns}
          url={apiRoutes.admin.systemAction.history}
          filters={filters}
          onInit={(tableInstance) => setTableInstance(tableInstance)}
        />
      </div>

    </PageContainer>
  );
};

export default FlatFeesListView;