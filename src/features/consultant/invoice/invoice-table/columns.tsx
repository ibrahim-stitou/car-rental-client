import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/format';
import { Invoice } from '@/stores/consultant/invoice-store';
import { Eye } from 'lucide-react';

// Format currency in EUR instead of USD
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// Define a type for the delete handler function
type DeleteInvoiceHandler = (id: string) => Promise<void>;

// Modified to accept a deleteHandler function from the parent component
export const invoiceColumns = (
  companyOptions: { label: string; value: string }[],
  deleteHandler?: DeleteInvoiceHandler
): ColumnDef<Invoice, unknown>[] => {
  return [
    {
      accessorKey: 'reference',
      header: () => <div className="text-center">Reference</div>,
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue('reference')}</div>,
    },
    {
      accessorKey: 'company',
      header: () => <div className="text-center">Company</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue('company')}</div>,
      enableColumnFilter: true,
      meta: {
        variant: 'select',
        label: 'Company',
        placeholder: 'Select a company',
        options: companyOptions,
      },
    },
    {
      accessorKey: 'total_amount',
      header: () => <div className="text-center">Amount</div>,
      cell: ({ row }) => <div className="text-center font-medium">{formatCurrency(row.getValue('total_amount'))}</div>,
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusColors: Record<string, string> = {
          pending: 'bg-blue-100 text-blue-600',
          validated: 'bg-green-100 text-green-600',
          rejected: 'bg-red-100 text-red-600',
          draft: 'bg-gray-100 text-gray-600',
          paid: 'bg-emerald-100 text-emerald-600',
          overdue: 'bg-orange-100 text-orange-600'
        };

        const statusDisplay: Record<string, string> = {
          pending: 'Pending',
          validated: 'Validated',
          rejected: 'Rejected',
          draft: 'Draft',
          paid: 'Paid',
          overdue: 'Overdue'
        };

        return (
          <div className="text-center">
            <Badge className={`${statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
              {statusDisplay[status.toLowerCase()] || status}
            </Badge>
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        variant: 'select',
        label: 'Status',
        placeholder: 'Select a status',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Validated', value: 'validated' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Draft', value: 'draft' },
          { label: 'Paid', value: 'paid' },
          { label: 'Overdue', value: 'overdue' }
        ],
      },
    },
    {
      accessorKey: 'date_invoice',
      header: () => <div className="text-center"> Date</div>,
      cell: ({ row }) => <div className="text-center">{formatDate(row.getValue('date_invoice'))}</div>,
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const invoice = row.original;

        return (
          <div className="flex justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/consultant/invoices/${invoice.id}/show`}>
                  <Button
                    variant="default"
                    className="bg-blue-100 text-blue-600 hover:bg-blue-200 p-1.5 h-8 w-8"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent
                className="bg-blue-100 text-blue-600 rounded-md px-2 py-1 shadow-md tooltip-content"
                sideOffset={5}
              >
                View Details
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
};