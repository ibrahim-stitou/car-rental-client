import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/format';
import { SubcontractorInvoice } from '@/stores/subcontractorInvoice-store';

export const invoiceColumns = ({
                                 onOpenModal,
                                 onValidate,
                                 onReject,
                                 isAdmin = false,
                               }: {
  onOpenModal: (id: number | string) => void;
  onValidate?: (id: number | string) => void;
  onReject?: (id: number | string) => void;
  isAdmin?: boolean;
}): ColumnDef<SubcontractorInvoice, unknown>[] => [
  {
    accessorKey: 'reference',
    header: () => <div className="text-center">Reference</div>,
    cell: ({ row }) => <div className="text-center">{row.original.reference}</div>,
  },
  {
    accessorKey: 'company',
    header: () => <div className="text-center">Company</div>,
    cell: ({ row }) => {
      // Use company field if available, otherwise fallback to consultant name
      const companyName = row.original.company ||
        (row.original.consultant ? `${row.original.consultant.nom} ${row.original.consultant.prenom}` : '---');
      return <div className="text-center">{companyName}</div>;
    },
  },
  {
    accessorKey: 'consultant',
    header: () => <div className="text-center">Consultant</div>,
    cell: ({ row }) => {
      const consultant = row.original.consultant;
      return (
        <div className="text-center">
          {consultant ? `${consultant.nom} ${consultant.prenom}` : '---'}
        </div>
      );
    },
  },
  {
    accessorKey: 'total_amount',
    header: () => <div className="text-center">Amount</div>,
    cell: ({ row }) => {
      return <div className="text-center">
        {new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(Number(row.original.total_amount))}
      </div>
    },
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        pending: 'bg-blue-100 text-blue-600',
        validated: 'bg-green-100 text-green-600',
        rejected: 'bg-red-100 text-red-600',
      };

      const statusDisplay: Record<string, string> = {
        pending: 'Pending',
        validated: 'Validated',
        rejected: 'Rejected',
      };

      return (
        <div className="text-center">
          <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
            {statusDisplay[status] || status}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'date_invoice',
    header: () => <div className="text-center">Date</div>,
    cell: ({ row }) => {
      return <div className="text-center">{formatDate(row.original.date_invoice)}</div>
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const invoice = row.original;
      // Use the isAdmin prop to determine base URL
      const baseUrl = isAdmin ? '/admin/subcontractor-Invoice' : '/consultant/invoices';

      return (
        <div className="flex justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/subcontractor-Invoice/${invoice.id}/show`}>
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

          {/* Only show approve/reject buttons for admins and pending invoices */}
          {isAdmin && invoice.status === 'pending' && onValidate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  className="bg-green-100 text-green-600 hover:bg-green-200 p-1.5 h-8 w-8"
                  onClick={() => onValidate(invoice.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-green-100 text-green-600 rounded-md px-2 py-1 shadow-md tooltip-content"
                sideOffset={5}
              >
                Validate Invoice
              </TooltipContent>
            </Tooltip>
          )}

          {isAdmin && invoice.status === 'pending' && onReject && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  className="bg-orange-100 text-orange-600 hover:bg-orange-200 p-1.5 h-8 w-8"
                  onClick={() => onReject(invoice.id)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-orange-100 text-orange-600 rounded-md px-2 py-1 shadow-md tooltip-content"
                sideOffset={5}
              >
                Reject Invoice
              </TooltipContent>
            </Tooltip>
          )}

          {/* Modified: Allow deletion of any invoice, regardless of status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 h-8 w-8"
                onClick={() => onOpenModal(invoice.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-red-100 text-red-600 rounded-md px-2 py-1 shadow-md tooltip-content"
              sideOffset={5}
            >
              Delete Invoice
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];