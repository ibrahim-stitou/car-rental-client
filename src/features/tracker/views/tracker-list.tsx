import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
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
import TrackerLabelSelect from '@/features/tracker/components/label-select';
import ConsultantSelect from '@/components/custom/consultant-select';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { getDateLocale } from '@/utils/date-utils';

interface Tracker {
  id: number;
  label: string;
  credit: number;
  debit: number;
  updated_at: string;
}

const TrackerList = () => {
  const { t,language } = useLanguage();
  const router = useRouter();
  const [selectedTracker, setSelectedTracker] = useState<
    number | string | null
  >(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [tableInstance, setTableInstance] = useState<Partial<
    UseTableReturn<Tracker>
  > | null>(null);
  const columns: CustomTableColumn<Tracker>[] = [
    {
      data: 'id',
      label: t('admin.trackers.table.id'),
      sortable: true
    },
    {
      data: 'label',
      label: t('admin.trackers.table.label'),
      sortable: true
    },
    {
      data: 'solde',
      label: t('admin.trackers.table.solde'),
      sortable: true
    },
    {
      data: 'consultant_id',
      label: t('admin.trackers.table.consultant'),
      sortable: true,
      render(value, _row) {
        return (
          <Button variant='link' asChild>
            <Link href={'/admin/users/' + value.id}>{value.name}</Link>
          </Button>
        );
      }
    },
    {
      data: 'month',
      label: t('admin.trackers.table.month'),
      sortable: true,
      render(value, _row) {
        return t(`months.${value}`);
      }
    },
    {
      data: 'year',
      label: t('admin.trackers.table.year'),
      sortable: true
    },
    {
      data: 'created_at',
      label: t('admin.trackers.table.created_at'),
      sortable: true
    },
    {
      data: 'paid',
      label: t('admin.trackers.table.paid'),
      sortable: true,
      render(value, _row) {
        return value ? (
          <Badge className="bg-green-100 text-green-800">
            {t('common.yes')}
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-800">
            {t('common.no')}
          </Badge>
        );      }
    },
    {
      data: 'actions',
      label: t('admin.trackers.table.actions'),
      sortable: false,
      render: (_value, row) => {
        return (
          <div className='flex items-center space-x-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='destructive'
                  className='h-8 w-8 bg-red-100 p-1.5 text-red-600 hover:bg-red-200'
                  onClick={() => handleDelete(row.id)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className='tooltip-content rounded-md bg-red-100 px-2 py-1 text-red-600 shadow-md'
                sideOffset={5}
              >
                {t('admin.trackers.delete')}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      }
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'label',
      defaultValue: null,
      label: t('admin.trackers.filters.label'),
      render: (methods) => {
        return (
          <TrackerLabelSelect
            name='label'
            form={methods}
            placeholder={t('admin.trackers.filters.label')}
          />
        );
      }
    },
    {
      field:'consultant_id',
      defaultValue: null,
      label: t('admin.trackers.filters.consultant'),
      type: 'custom',
      render:(methods) => <ConsultantSelect name="consultant_id" form={methods} placeholder={t('admin.trackers.filters.consultant')}  />,
    },
    {
      field:'created_at',
      type:'date',
      label: t('admin.trackers.filters.created_at'),
    },
    {
      field:'solde',
      label: t('admin.trackers.filters.solde'),
      type: 'number',
    },
    {
      field: 'month',
      defaultValue: null,
      label: t('admin.trackers.filters.month'),
      type: 'select',
      options: Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: t(`months.${i + 1}`)
      }))
    },
    {
      field: 'year',
      label: t('admin.trackers.filters.year'),
      type: 'number',
    },
    {
      type: 'datatable-select',
      field: 'paid',
      label: t('admin.trackers.filters.paid'),
      options:[
        { value: '1', label: t('common.yes') },
        { value: '0', label: t('common.no') }
      ]
    },

  ];
  const handleDelete = (id: number) => {
    setSelectedTracker(id);
    setOpenDeleteModal(true);
  };
  const handleConfirmDelete = () => {
    if (selectedTracker !== null) {
      apiClient
        .delete(apiRoutes.admin.trackers.delete(selectedTracker))
        .then((response) => {
          setOpenDeleteModal(false);
          toast.success(response.data.message);
          if (tableInstance) {
            tableInstance.refresh?.();
          } else {
            router.push(PATHS.admin.trackers.list.link);
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
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={t('admin.trackers.title')}
            description={t('admin.trackers.description')}
          />
          <Button asChild>
            <Link href={PATHS.admin.trackers.create.link}>
              <Plus className='mr-2 h-4 w-4' /> {t('admin.trackers.addNew')}
            </Link>
          </Button>
        </div>
        <Separator />
        <CustomTable<Tracker>
          columns={columns}
          url={PATHS.admin.trackers.list.link}
          filters={filters}
          onInit={(tableInstance) => setTableInstance(tableInstance)}
        />
      </div>
      <CustomAlertDialog
        title={t('admin.trackers.deleteModal.title')}
        description={t('admin.trackers.deleteModal.description')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </PageContainer>
  );
};

export default TrackerList;
