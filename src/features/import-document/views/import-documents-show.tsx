import React, {useMemo } from 'react';
import { Heading } from '@/components/ui/heading';

import PageContainer from '@/components/layout/page-container';
import { useLanguage } from '@/context/LanguageContext';
import { CustomTableColumn } from '@/components/custom/data-table/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DownloadCloudIcon, EyeIcon } from 'lucide-react';
import { apiRoutes } from '@/config/apiRoutes';
import CustomTable from '@/components/custom/data-table/custom-table';
import { Separator } from '@radix-ui/react-separator';

interface ImportRow {
  id:number|string;
  name:string;
  status:string;
  error:string;
  url:string;
  raw_status: 'treated'|'failed' ;
}

interface Props {
  id: number | string;
}
const ImportDocumentsShow = ({id}:Props) => {
   const {t} = useLanguage();
  const columns: CustomTableColumn<ImportRow  >[] = useMemo(
    () => [
      {
        data: 'id',
        label: t('admin.documentImports.table.id'),
        sortable: true
      },
      {
        data:'name',
        label : t('admin.documentImports.table.name'),
        sortable:true,
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
              row.raw_status === 'treated' ?
                'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }
            >
              {value}
            </Badge>
          );
        }
      },
      {
        data:'error',
        label : t('admin.documentImports.table.error'),
        sortable:true,
        render:(value, row)=>{
          return value ?? '---'
        }
      },
      {
        data: 'created_at',
        label: t('admin.documentImports.table.created_at'),
        sortable: true
      },
      {
        data: 'actions',
        label: t('admin.documentImports.table.actions'),
        sortable: false,
        render: (_, _row) => <div className='flex items-center space-x-2'>
          <Button asChild >
            <Link href={_row.url} target='_blank' >
              <DownloadCloudIcon/>
            </Link>
          </Button>
        </div>
      }
    ],
    [t]
  );
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={t('admin.documentImports.show.title')}
            description={t('admin.documentImports.show.description')}
          />
        </div>
        <Separator />
        <CustomTable<ImportRow>
          columns={columns}
          url={apiRoutes.admin.import_document.detail(id)}
        />
      </div>

    </PageContainer>
  );
};

export default ImportDocumentsShow;