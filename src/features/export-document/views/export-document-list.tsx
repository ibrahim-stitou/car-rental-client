// src/features/export-document/views/export-document-list.tsx
'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PageContainer from '@/components/layout/page-container';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CustomTable from '@/components/custom/data-table/custom-table';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { apiRoutes } from '@/config/apiRoutes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDownToLine, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ExportDocument {
  id: number;
  document_type: string;
  status: string;
  month: string;
  year: string;
  count: number;
  errors: string | null;
  paid: string;
  created_at: string;
  updated_at: string;
  document_id: number;
  media: string;
}

export function ExportDocumentListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<ExportDocument>> | null>(null);
  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      const response = await apiClient.get(
        apiRoutes.admin.documentsExports.download(documentId),
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `export-${documentId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('admin.exportDocuments.downloadSuccess'));
    } catch (error) {
      toast.error(t('admin.exportDocuments.downloadFailed'));
      console.error('Error downloading file:', error);
    }
  };
  const columns: CustomTableColumn<ExportDocument>[] = [
    {
      data: 'id',
      label: t('admin.exportDocuments.table.id'),
      sortable: true
    },
    {
      data: 'document_type',
      label: t('admin.exportDocuments.table.documentType'),
      sortable: true,
      render: (value) => {
        return t(`admin.exportDocuments.documentTypes.${value}`) || value;
      }
    },
    {
      data: 'month',
      label: t('admin.exportDocuments.table.month'),
      sortable: true,
      render: (value) => {
        const month = value.startsWith('0') ? value.slice(1) : value;
        return t(`common.months.${month}`);
      }
    },
    {
      data: 'year',
      label: t('admin.exportDocuments.table.year'),
      sortable: true
    },
    {
      data: 'count',
      label: t('admin.exportDocuments.table.count'),
      sortable: true
    },
    {
      data: 'status',
      label: t('admin.exportDocuments.table.status'),
      sortable: true,
      render: (value) => {
        const statusLabels = {
          treating: t('admin.exportDocuments.status.treating'),
          treated: t('admin.exportDocuments.status.treated'),
          failed: t('admin.exportDocuments.status.failed')
        };

        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          processing: "bg-blue-100 text-blue-800",
          treated: "bg-green-100 text-green-800",
          failed: "bg-red-100 text-red-800"
        };

        return (
          <Badge className={
            //@ts-ignore
            statusColors[value] || ""}>{statusLabels[value] || value}
          </Badge>
        );
      }
    },
    {
      data: 'paid',
      label: t('admin.exportDocuments.table.paid'),
      sortable: true,
      render: (value) => {
        const isPaid = value === "Oui";
        return (
          <Badge className={isPaid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {isPaid ? t('common.yes') : t('common.no')}
          </Badge>
        );
      }
    },
    {
      data: 'created_at',
      label: t('admin.exportDocuments.table.created_at'),
      sortable: true
    },
    {
      data: 'actions',
      label: t('admin.exportDocuments.table.actions'),
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          {row.status === 'treated' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => handleDownload(
                  row.id,
                  //@ts-ignore
                  row.media?.[0]?.file_name || `${row.document_type}_${row.month}_${row.year}.xlsx`
                )}
              >
                <ArrowDownToLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('admin.exportDocuments.download')}
            </TooltipContent>
          </Tooltip>
          )}
        </div>
      )
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'month',
      label: t('admin.exportDocuments.filters.month'),
      type: 'select',
      options: Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString().padStart(2, '0'),
        label: t(`months.${i + 1}`)
      }))
    },
    {
      field: 'year',
      label: t('admin.exportDocuments.filters.year'),
      type: 'select',
      options: (() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => ({
          value: (currentYear - 2 + i).toString(),
          label: (currentYear - 2 + i).toString()
        }));
      })()
    },
    {
      field: 'document_type',
      label: t('admin.exportDocuments.filters.documentType'),
      type: 'select',
      options: [
        { value: 'subconstractor_invoices', label: t('admin.exportDocuments.documentTypes.subcontractor_invoices') },
        { value: 'salaries', label: t('admin.exportDocuments.documentTypes.salaries') },
        { value: 'expenses', label: t('admin.exportDocuments.documentTypes.expenses') },
        { value: 'mileage_expenses', label: t('admin.exportDocuments.documentTypes.mileage_expenses') },
      ]
    },
    {
      field: 'status',
      label: t('admin.exportDocuments.filters.status'),
      type: 'select',
      options: [
        { value: 'treating', label: t('admin.exportDocuments.status.treating') },
        { value: 'treated', label: t('admin.exportDocuments.status.treated') },
        { value: 'failed', label: t('admin.exportDocuments.status.failed') }
      ]
    },
    {
      field: 'paid',
      label: t('admin.exportDocuments.filters.paid'),
      type: 'select',
      options: [
        { value: 'true', label: t('common.yes') },
        { value: 'false', label: t('common.no') }
      ]
    }
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className='flex items-start justify-between'>
          <Heading
            title={t('admin.exportDocuments.title')}
            description={t('admin.exportDocuments.description')}
          />
          <Link
            href='/admin/export-documents/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <IconPlus className='mr-2 h-4 w-4' /> {t('admin.exportDocuments.add')}
          </Link>
        </div>
        <Separator />
        <CustomTable<ExportDocument>
          columns={columns}
          url={apiRoutes.admin.documentsExports.list}
          filters={filters}
          onInit={(instance) => setTableInstance(instance)}
        />
      </div>
    </PageContainer>
  );
}