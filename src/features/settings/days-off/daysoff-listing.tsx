import React, { useState, useMemo } from 'react';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
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
import CustomAlertDialog from '@/components/custom/customAlert';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import AddHolidayButton from '@/features/settings/days-off/add-holiday-button';

interface DayOff {
  id: number;
  name: string;
  country_id: {
    id: number;
    name: string;
  };
  month: number;
  year: number | null;
  day: number;
  created_at: string;
  updated_at: string;
  is_recuring: string;
  pays: {
    id: number;
    nom: string;
    code: string;
    indicatif_telephonique: string;
    devise: string;
    tva_standard: number;
    created_at: string | null;
    updated_at: string | null;
  };
  date: string;
}

export default function DaysOffListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedDayOff, setSelectedDayOff] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [tableInstance, setTableInstance] = useState<Partial<
    UseTableReturn<DayOff>
  > | null>(null);

  const columns: CustomTableColumn<DayOff>[] = useMemo(
    () => [
      {
        data: 'id',
        label: t('admin.settings.daysOff.table.id'),
        sortable: true
      },
      {
        data: 'name',
        label: t('admin.settings.daysOff.table.name'),
        sortable: true
      },
      {
        data: 'pays',
        label: t('admin.settings.daysOff.table.country'),
        sortable: true,
        render(value) {
          return value?.nom || '-';
        }
      },
      {
        data: 'date',
        label: t('admin.settings.daysOff.table.date'),
        sortable: true
      },
      {
        data: 'is_recuring',
        label: t('admin.settings.daysOff.table.recurring'),
        sortable: true
      },
      {
        data: 'id',
        label: t('admin.settings.daysOff.table.actions'),
        sortable: false,
        className: 'w-24',
        render: (_, row) => (
          <div className="flex items-center">
            <DeleteButton
              label={t('common.delete')}
              onClick={() => handleDelete(row.id)}
            />
          </div>
        )
      }
    ],
    [t]
  );
//@ts-ignore
  const filters: CustomTableFilterConfig[] = useMemo(
    () => [
      {
        field: 'month',
        defaultValue: null,
        label: t('admin.settings.daysOff.filters.month'),
        type: 'select',
        options: Array.from({ length: 12 }, (_, i) => ({
          value: i + 1,
          label: t(`months.${i + 1}`)
        }))
      },
      {
        field: 'year',
        label: t('admin.settings.daysOff.filters.year'),
        type: 'number'
      },
      {
        field: 'is_recuring',
        label: t('admin.settings.daysOff.filters.recurring'),
        type: 'select',
        options: [
          { value: 'true', label: t('common.yes') },
          { value: 'false', label: t('common.no') }
        ]
      }
    ],
    [t, tableInstance?.data]
  );

  const handleDelete = (id: number) => {
    setSelectedDayOff(id);
    setOpenDeleteModal(true);
  };


  const handleConfirmDelete = async () => {
    if (selectedDayOff !== null) {
      try {
        const response = await apiClient.delete(
          apiRoutes.admin.settings.daysOff.delete(selectedDayOff)
        );
        setOpenDeleteModal(false);
        toast.success(response.data.message || t('admin.settings.daysOff.deleteSuccess'));

        // Refresh the table
        if (tableInstance?.refresh) {
          tableInstance.refresh();
        }
      } catch (error: any) {
        console.error('Delete Error:', error);
        toast.error(error?.message || t('common.errorOccurred'));
      }
    }
    setOpenDeleteModal(false);
  };

  const refreshData = () => {
    if (tableInstance?.refresh) {
      tableInstance.refresh();
    }
  };

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className='flex items-start justify-between'>
        <Heading
          title={t('admin.settings.daysOff.listing.title')}
          description={t('admin.settings.daysOff.listing.description')}
        />
        <AddHolidayButton />
      </div>
      <Separator />
      <CustomTable<DayOff>
        columns={columns}
        url={apiRoutes.admin.settings.daysOff.list}
        filters={filters}
        onInit={setTableInstance}
      />

      <CustomAlertDialog
        title={t('admin.settings.daysOff.deleteModal.title')}
        description={t('admin.settings.daysOff.deleteModal.description')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />

    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
}

const DeleteButton: React.FC<ActionButtonProps> = ({ label, onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant='destructive'
        className='h-8 w-8 bg-red-100 p-1.5 text-red-600 hover:bg-red-200'
        onClick={onClick}
        aria-label={label}
      >
        <Trash2 className='h-4 w-4' />
      </Button>
    </TooltipTrigger>
    <TooltipContent
      className='tooltip-content rounded-md bg-red-100 px-2 py-1 text-red-600 shadow-md'
      sideOffset={5}
    >
      {label}
    </TooltipContent>
  </Tooltip>
);
