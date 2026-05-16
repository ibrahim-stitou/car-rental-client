'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MileageExpense } from '@/stores/mileage-expense-store';
import { formatDate } from '@/lib/format';

export const mileageExpenseColumns = ({
                                        onOpenDeleteModal,
                                      }: {
  onOpenDeleteModal: (id: number) => void;
  onValidate: (id: number) => void;
  onReject: (id: number) => void;
}): ColumnDef<MileageExpense, unknown>[] => [
  {
    accessorKey: 'id',
    header: () => <div className="text-center">N°</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.id}</div>,
  },
  {
    accessorKey: 'consultant',
    header: () => <div className="text-center">Consultant</div>,
    cell: ({ row }) => {
      const consultant = row.original.consultant;
      const fullName = consultant ? `${consultant.prenom} ${consultant.nom}` : '---';
      return <div className="text-center">{fullName}</div>;
    },
  },
  {
    accessorKey: 'month_year',
    header: () => <div className="text-center">Period</div>,
    cell: ({ row }) => {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = months[row.original.month - 1] || '';
      return <div className="text-center">{`${monthName} ${row.original.year}`}</div>;
    },
  },
  {
    accessorKey: 'total_km',
    header: () => <div className="text-center">Total KM</div>,
    cell: ({ row }) => <div className="text-center">{row.original.total_km} km</div>,
  },
  {
    accessorKey: 'amount_ttc',
    header: () => <div className="text-center">Amount</div>,
    cell: ({ row }) => <div className="text-center">{row.original.amount_ttc} </div>,
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-600',
        validated: 'bg-green-100 text-green-600',
        rejected: 'bg-red-100 text-red-600',
      };

      const statusDisplay: Record<string, string> = {
        pending: 'Pending',
        validated: 'Validated',
        rejected: 'Rejected',
        to_sign:'waiting for signature'
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
    accessorKey: 'created_at',
    header: () => <div className="text-center">Submission Date</div>,
    cell: ({ row }) => <div className="text-center">{formatDate(row.original.created_at)}</div>,
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const mileageExpense = row.original;
      const isPending = mileageExpense.status === 'pending';

      return (
        <div className="flex justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/mileage-expenses/${mileageExpense.id}/show`}>
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 h-8 w-8"
                onClick={() => onOpenDeleteModal(mileageExpense.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-red-100 text-red-600 rounded-md px-2 py-1 shadow-md tooltip-content"
              sideOffset={5}
            >
              Delete Expense
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];