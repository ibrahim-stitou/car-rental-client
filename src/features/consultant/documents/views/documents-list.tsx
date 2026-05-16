'use client';

import React, { useMemo } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { useLanguage } from '@/context/LanguageContext';
import {
  CustomTableColumn,
  CustomTableFilterConfig
} from '@/components/custom/data-table/types';
import CustomTable from '@/components/custom/data-table/custom-table';
import { apiRoutes } from '@/config/apiRoutes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { DownloadCloudIcon } from 'lucide-react';
import DocumentTypeSelect from '@/components/custom/document-type-select';

interface Document {
  id: number;
  name: string;
  created_at: string;
  document_type: string;
  month: number;
  year: number;
  url: string;
}

const DocumentsList = () => {
  const { t } = useLanguage();

  const columns: CustomTableColumn<Document>[] = useMemo(
    () => [
      {
        data: 'name',
        label: t('consultant.documents.table.name'),
        sortable: true
      },
      {
        data: 'month',
        label: t('consultant.documents.table.month'),
        sortable: true,
        render(value: number) {
          return t(`months.${value}`);
        }
      },
      {
        data: 'year',
        label: t('consultant.documents.table.year'),
        sortable: true
      },
      {
        data: 'document_type',
        label: t('consultant.documents.table.document_type'),
        sortable: true
      },

      {
        data: 'created_at',
        label: t('consultant.documents.table.created_at'),
        sortable: true
      },
      {
        data: 'actions',
        label: t('consultant.documents.table.actions'),
        sortable: false,
        render: (_, _row) => (
          <div className='flex items-center space-x-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className='h-8 w-8 p-1.5' asChild>
                  <Link href={_row.url} target='_blank'>
                    <DownloadCloudIcon className='h-4 w-4' />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className='tooltip-content rounded-md px-2 py-1 shadow-md'
                sideOffset={5}
              >
                {t('consultant.documents.download')}
              </TooltipContent>
            </Tooltip>
          </div>
        )
      }
    ],
    [t]
  ); // Only re-run when `t` changes (translations)

  const filters: CustomTableFilterConfig[] = useMemo(
    () => [
      {
        field: 'name',
        label: t('consultant.documents.filters.name'),
        type: 'text'
      },
      {
        field: 'document_type',
        label: t('consultant.documents.filters.document_type'),
        type: 'custom',
        render: (form) => (
          <DocumentTypeSelect
            form={form}
            name='document_type'
            placeholder={t('consultant.documents.filters.document_type')}
          />
        )
      },
      {
        field: 'month',
        defaultValue: null,
        label: t('consultant.documents.filters.month'),
        type: 'select',
        options: Array.from({ length: 12 }, (_, i) => ({
          value: i + 1,
          label: t(`months.${i + 1}`)
        }))
      },
      {
        field: 'year',
        label: t('consultant.documents.filters.year'),
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
            title={t('consultant.documents.title')}
            description={t('consultant.documents.description')}
          />
        </div>

        <CustomTable
          url={apiRoutes.consultant.documents.list}
          columns={columns}
          filters={filters}
        />
      </div>
    </PageContainer>
  );
};

export default DocumentsList;
