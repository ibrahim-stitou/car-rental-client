'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConsultantExpense } from '@/stores/consultant/expenses-store';
import { formatDate } from '@/lib/format';

export const consultantExpenseColumns = ({
                                           onOpenModal,
                                         }: {
  onOpenModal: (id: number) => void;
}): ColumnDef<ConsultantExpense, unknown>[] => [
  {
    accessorKey: 'mission',
    header: () => <div className="text-center">Mission</div>,
    cell: ({ row }) => <div className="text-center">{row.original.mission?.title || 'N/A'}</div>,
  },
  {
    accessorKey: 'month',
    header: () => <div className="text-center">Month</div>,
    cell: ({ row }) => {
      const monthNumber = parseInt(row.original.month, 10);
      const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(0, monthNumber - 1));
      return <div className="text-center">{monthName}</div>;
    },
  },
  {
    accessorKey: 'year',
    header: () => <div className="text-center">Year</div>,
    cell: ({ row }) => <div className="text-center">{row.original.year}</div>,
  },
  {
    accessorKey: 'total_ttc',
    header: () => <div className="text-center">Total (TTC)</div>,
    cell: ({ row }) => <div className="text-center">{parseFloat(row.original.total_ttc).toFixed(2)} </div>,
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-600',
        pending: 'bg-yellow-100 text-yellow-600',
        validated: 'bg-green-100 text-green-600',
        rejected: 'bg-red-100 text-red-600',
      };

      const statusDisplay: Record<string, string> = {
        draft: 'Draft',
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
    accessorKey: 'created_at',
    header: () => <div className="text-center">Created At</div>,
    cell: ({ row }) => <div className="text-center">{formatDate(row.original.created_at)}</div>,
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const expense = row.original;

      return (
        <div className="flex justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/consultant/expenses/${expense.id}`}>
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

          {expense.status === 'draft' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 h-8 w-8"
                  onClick={() => onOpenModal(expense.id)}
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
          )}
        </div>
      );
    },
  },
];