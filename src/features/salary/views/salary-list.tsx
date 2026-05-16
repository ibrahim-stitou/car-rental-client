import React, { useState, useMemo } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download, Plus, Trash2, UploadIcon } from 'lucide-react';
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
import ConsultantSelect from '@/components/custom/consultant-select';
import { useRouter } from 'next/navigation';
import { FileUploader } from '@/components/file-uploader';
import Dropzone from 'react-dropzone';
import { Form, useForm } from 'react-hook-form';
import { FormField } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import SalaryUploadModal from '@/features/salary/components/uploadModal';

interface Salary {
  id: number;
  month: number;
  year: number;
  employer_contribution: number;
  employee_contribution: number;
  net_salary: number;
  tax: number;
  consultant: {
    id: number;
    name: string;
  };
  file?:string;
}

const SalaryList = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedSalary, setSelectedSalary] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [tableInstance, setTableInstance] = useState<Partial<
    UseTableReturn<Salary>
  > | null>(null);
  const [openUploadModal, setOpenUploadModal] = useState(false);



  const columns: CustomTableColumn<Salary>[] = useMemo(
    () => [
      {
        data: 'id',
        label: t('admin.salaries.table.id'),
        sortable: true
      },
      {
        data: 'consultant',
        label: t('admin.salaries.table.consultant'),
        sortable: true,
        render(value) {
          return (
            <Button variant='link' asChild>
              <Link
                href={`/admin/users/${value.id}/show`}
                aria-label={`${t('admin.salaries.viewConsultant')}: ${value.name}`}
              >
                {value.name}
              </Link>
            </Button>
          );
        }
      },
      {
        data: 'month',
        label: t('admin.salaries.table.month'),
        sortable: true,
        render(value) {
          return t(`months.${value}`);
        }
      },
      {
        data: 'year',
        label: t('admin.salaries.table.year'),
        sortable: true
      },
      {
        data: 'net_salary',
        label: t('admin.salaries.table.net_salary'),
        sortable: true,
        render: (value) => value ?? 0
      },
      {
        data: 'employer_contribution',
        label: t('admin.salaries.table.employer_contribution'),
        sortable: true,
        render: (value) => value ?? 0
      },
      {
        data: 'employee_contribution',
        label: t('admin.salaries.table.employee_contribution'),
        sortable: true,
        render: (value) => value ?? 0
      },
      {
        data: 'tax',
        label: t('admin.salaries.table.tax'),
        sortable: true,
        render: (value) => value ?? 0
      },
      {
        data: 'actions',
        label: t('admin.salaries.table.actions'),
        sortable: false,
        render: (_, row) => (
          <div className='flex items-center space-x-2'>
            {row.file && <DownloadButton
              label={t('admin.salaries.download')}
              onClick={() => window.open(row.file, '_blank')}
            />}
            <DeleteButton
              label={t('admin.salaries.delete')}
              onClick={() => handleDelete(row.id)}
            />
          </div>
        )
      }
    ],
    [t]
  ); // Only re-run when `t` changes (translations)

  const filters: CustomTableFilterConfig[] = useMemo(
    () => [
      {
        field: 'consultant_id',
        defaultValue: null,
        label: t('admin.salaries.filters.consultant'),
        type: 'custom',
        render: (methods) => (
          <ConsultantSelect
            name='consultant_id'
            form={methods}
            placeholder={t('admin.salaries.filters.consultant')}
          />
        )
      },
      {
        field: 'month',
        defaultValue: null,
        label: t('admin.salaries.filters.month'),
        type: 'select',
        options: Array.from({ length: 12 }, (_, i) => ({
          value: i + 1,
          label: t(`months.${i + 1}`)
        }))
      },
      {
        field: 'year',
        label: t('admin.salaries.filters.year'),
        type: 'number'
      },
      {
        field: 'net_salary',
        label: t('admin.salaries.filters.net_salary'),
        type: 'number'
      },
      {
        field: 'employer_contribution',
        label: t('admin.salaries.filters.employer_contribution'),
        type: 'number'
      },
      {
        field: 'employee_contribution',
        label: t('admin.salaries.filters.employee_contribution'),
        type: 'number'
      },
      {
        field: 'tax',
        type: 'number',
        label: t('admin.salaries.filters.tax')
      }
    ],
    [t]
  ); // Only re-run when `t` changes (translations)

  const handleDelete = (id: number) => {
    setSelectedSalary(id);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedSalary !== null) {
      try {
        const response = await apiClient.delete(
          apiRoutes.admin.salaries.delete(selectedSalary)
        );
        setOpenDeleteModal(false);
        toast.success(response.data.message);

        // Optimized table refresh
        if (tableInstance?.refresh) {
          tableInstance.refresh();
        } else {
          router.push(PATHS.admin.salaries.list.link);
        }
      } catch (error: any) {
        console.error('Delete Error:', error);
        toast.error(error?.message || t('common.errorOccurred'));
      }
    }
    setOpenDeleteModal(false);
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={t('admin.salaries.title')}
            description={t('admin.salaries.description')}
          />
          <div className='flex items-center space-x-2'>
            <Button
              role='button'
              variant='secondary'
              onClick={() => setOpenUploadModal(true)}
            >
              <UploadIcon className='mr-2 h-4 w-4' />
              {t('admin.salaries.upload')}
            </Button>
            <Button asChild>
              <Link
                href={PATHS.admin.salaries.create.link}
                aria-label={t('admin.salaries.addNew')}
              >
                <Plus className='mr-2 h-4 w-4' /> {t('admin.salaries.addNew')}
              </Link>
            </Button>
          </div>
        </div>
        <Separator />
        <CustomTable<Salary>
          columns={columns}
          url={apiRoutes.admin.salaries.list}
          filters={filters}
          onInit={setTableInstance}
        />
      </div>
      <CustomAlertDialog
        title={t('admin.salaries.deleteModal.title')}
        description={t('admin.salaries.deleteModal.description')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        onConfirm={handleConfirmDelete}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />

      <SalaryUploadModal open={openUploadModal} setOpen={setOpenUploadModal} onConfirm={tableInstance?.refresh} />

    </PageContainer>
  );
};

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

const DownloadButton: React.FC<ActionButtonProps> = ({ label, onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant='outline'
        className="h-8 w-8 p-1.5"
        onClick={onClick}
        aria-label={label}
      >
        <Download className='h-4 w-4' />
      </Button>
    </TooltipTrigger>
    <TooltipContent
      className='tooltip-content rounded-md bg-blue-100 px-2 py-1 text-blue-600 shadow-md'
      sideOffset={5}
    >
      {label}
    </TooltipContent>
  </Tooltip>
)

export default SalaryList;
