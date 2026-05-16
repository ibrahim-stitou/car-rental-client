'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import CustomTable from '@/components/custom/data-table/custom-table';
import { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { apiRoutes } from '@/config/apiRoutes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
interface Invoice {
  id: number;
  reference: string;
  company: string;
  total_amount: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  date_invoice: string;
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
}

export function InvoiceListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Invoice>> | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  const columns: CustomTableColumn<Invoice>[] = [
    {
      data: 'id',
      label: t('consultant.invoices.table.id'),
      sortable: true
    },
    {
      data: 'reference',
      label: t('consultant.invoices.table.reference'),
      sortable: true
    },
    {
      data: 'company',
      label: t('consultant.invoices.table.company'),
      sortable: true
    },
    {
      data: 'total_amount',
      label: t('consultant.invoices.table.amount'),
      sortable: true,
      render: (value) => {
        const amount = value == null ? 0 : parseFloat(value);
        return `€${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },
    {
      data: 'status',
      label: t('consultant.invoices.table.status'),
      sortable: true,
      render: (value) => {
        const statusLabels = {
          pending: t('consultant.invoices.status.pending'),
          approved: t('consultant.invoices.status.approved'),
          rejected: t('consultant.invoices.status.rejected'),
          paid: t('consultant.invoices.status.paid')
        };

        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
          paid: "bg-blue-100 text-blue-800"
        };

        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || ""}>
            {statusLabels[value as keyof typeof statusLabels] || value}
          </Badge>
        );
      }
    },
    {
      data: 'date_invoice',
      label: t('consultant.invoices.table.invoiceDate'),
      sortable: true
    },
    {
      data: 'created_at',
      label: t('consultant.invoices.table.createdAt'),
      sortable: true
    },
    {
      data: 'actions',
      label: t('consultant.invoices.table.actions'),
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-1.5"
                onClick={() => router.push(`/consultant/invoices/${row.id}/show`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('consultant.invoices.actions.view')}
            </TooltipContent>
          </Tooltip>

        </div>
      )
    }
  ];

  const filters: CustomTableFilterConfig[] = [
    {
      field: 'reference',
      label: t('consultant.invoices.filters.reference'),
      type: 'text'
    },
    {
      field: 'company',
      label: t('consultant.invoices.filters.company'),
      type: 'text'
    },
    {
      field: 'status',
      label: t('consultant.invoices.filters.status'),
      type: 'select',
      options: [
        { value: 'pending', label: t('consultant.invoices.status.pending') },
        { value: 'approved', label: t('consultant.invoices.status.approved') },
        { value: 'rejected', label: t('consultant.invoices.status.rejected') },
        { value: 'paid', label: t('consultant.invoices.status.paid') }
      ]
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className='flex items-start justify-between'>
          <Heading
            title={t('consultant.invoices.title')}
            description={t('consultant.invoices.subtitle')}
          />
          <Link
            href='/consultant/invoices/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <IconPlus className='mr-2 h-4 w-4' /> {t('consultant.invoices.actions.add')}
          </Link>
        </div>
        <Separator />

        <CustomTable<Invoice>
          columns={columns}
          url={apiRoutes.consultant.invoices.list}
          filters={filters}
          onInit={(instance) => setTableInstance(instance)}
        />
      </div>
    </PageContainer>
  );
}