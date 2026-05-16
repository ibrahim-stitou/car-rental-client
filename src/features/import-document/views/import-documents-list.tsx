'use client';

import React, { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  CustomTableColumn,
  CustomTableFilterConfig
} from '@/components/custom/data-table/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Heading } from '@/components/ui/heading';
import { EyeIcon, Plus } from 'lucide-react';
import { PATHS } from '@/config/paths';
import { Separator } from '@/components/ui/separator';
import CustomTable from '@/components/custom/data-table/custom-table';
import { apiRoutes } from '@/config/apiRoutes';
import { Badge } from '@/components/ui/badge';
import PageContainer from '@/components/layout/page-container';
import DocumentTypeSelect from '@/components/custom/document-type-select';
import DocumentStatusSelect from '@/features/import-document/components/import-documents-status-select';

interface Import {
  id: number;
  created_at: string;
  document_type: string;
  score: string;
  month: number;
  year: number;
  status: string;
  raw_score: number;
  count: number;
  raw_status: 'treating' | 'treated' | 'failed';
}

const ImportDocumentsList = () => {
  const { t } = useLanguage();

  const columns: CustomTableColumn<Import>[] = useMemo(
    () => [
      {
        data: 'id',
        label: t('admin.documentImports.table.id'),
        sortable: true
      },
      {
        data: 'month',
        label: t('admin.documentImports.table.month'),
        sortable: true,
        render(value: number) {
          return t(`months.${value}`);
        }
      },
      {
        data: 'year',
        label: t('admin.documentImports.table.year'),
        sortable: true
      },
      {
        data: 'status',
        label: t('admin.documentImports.table.status'),
        sortable: true,
        render: (value, row) => {
          return (
            <Badge
              variant='default'
              className={
                row.raw_status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : row.raw_status === 'treated'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
              }
            >
              {value}
            </Badge>
          );
        }
      },

      {
        data: 'document_type',
        label: t('admin.documentImports.table.document_type'),
        sortable: true
      },

      {
        data: 'created_at',
        label: t('admin.documentImports.table.created_at'),
        sortable: true
      },
      {
        data: 'score',
        label: t('admin.documentImports.table.score'),
        sortable: true,
        render: (value, row) => {
          return (
            <Badge
              variant='default'
              className={
                row.raw_score === 0
                  ? 'bg-red-100 text-red-800'
                  : row.raw_score === row.count
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
              }
            >
              {value}
            </Badge>
          );
        }
      },
      {
        data: 'actions',
        label: t('admin.documentImports.table.actions'),
        sortable: false,
        render: (_, _row) => <div className='flex items-center space-x-2'>
          <Button asChild >
            <Link href={PATHS.admin.import_document.details.link(_row.id)}>
              <EyeIcon/>
            </Link>
          </Button>
        </div>
      }
    ],
    [t]
  );

  const filters: CustomTableFilterConfig[] = useMemo(
    () => [
      {
        field:'document_type',
        defaultValue: null,
        label: t('admin.documentImports.filters.document_type'),
        type: 'custom',
        render:(form)=>(
          <DocumentTypeSelect
            form={form}
            name='document_type'
            placeholder={t('admin.documentImports.filters.document_type')}
          />
        )
      },
      {
        field: 'status',
        label: t('admin.documentImports.filters.status'),
        type: 'custom',
        render: form => <DocumentStatusSelect name="status" form={form} placeholder={t('admin.documentImports.filters.status')} />
      },
      {
        field: 'month',
        defaultValue: null,
        label: t('admin.documentImports.filters.month'),
        type: 'select',
        options: Array.from({ length: 12 }, (_, i) => ({
          value: i + 1,
          label: t(`months.${i + 1}`)
        }))
      },
      {
        field: 'year',
        label: t('admin.documentImports.filters.year'),
        type: 'number'
      }
    ],
    [t]
  );
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={t('admin.documentImports.title')}
            description={t('admin.documentImports.description')}
          />
          <div className='flex items-center space-x-2'>
            <Button asChild>
              <Link
                href={PATHS.admin.import_document.create.link}
                aria-label={t('admin.documentImports.addNew')}
              >
                <Plus className='mr-2 h-4 w-4' />{' '}
                {t('admin.documentImports.addNew')}
              </Link>
            </Button>
          </div>
        </div>
        <Separator />
        <CustomTable<Import>
          columns={columns}
          url={apiRoutes.admin.import_document.list}
          filters={filters}
        />
      </div>
    </PageContainer>
  );
};

export default ImportDocumentsList;
