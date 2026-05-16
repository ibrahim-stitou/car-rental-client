'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Contract } from '@/stores/contract-store';
import { formatDate } from '@/lib/format'; 

export const contractColumns = ({
  onOpenModal,
}: {
  onOpenModal: (id: number) => void;
}): ColumnDef<Contract, unknown>[] => [
  {
    accessorKey: 'id',
    header: () => <div className="text-center">N°</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.id}</div>,
  },
  {
    accessorKey: 'reference',
    header: () => <div className="text-center">Reference</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.reference}</div>,
  },
  {
    accessorKey: 'consultant',
    header: () => <div className="text-center">Consultant</div>,
    cell: ({ row }) => <div className="text-center">{row.original.consultant.full_name}</div>,
  },
  {
    accessorKey: 'contract_type',
    header: () => <div className="text-center">Type</div>,
    cell: ({ row }) => {
      const contractType = row.original.contract_type.toUpperCase();
      return <div className="text-center">{contractType}</div>;
    },
  },
  {
    accessorKey: 'dates',
    header: () => <div className="text-center">Period</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {formatDate(row.original.start_at)} {row.original.end_at ? ` - ${formatDate(row.original.end_at)}` : ''}
      </div>
    ),
  },
  {
    accessorKey: 'fees',
    header: () => <div className="text-center">Flat fees</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.fees_amount}{row.original.fess_type === 'percentage' ? ' %' : ' '}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        'in_progress': 'bg-green-100 text-green-600',
        'terminated': 'bg-red-100 text-red-600',
        'pending': 'bg-yellow-100 text-yellow-600',
        'completed': 'bg-blue-100 text-blue-600'
      };

      const statusDisplay: Record<string, string> = {
        'in_progress': 'In Progress',
        'terminated': 'Terminated',
        'pending': 'Pending',
        'completed': 'Completed'
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
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const contract = row.original;

      return (
        <div className="flex justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/contracts/${contract.id}/show`}>
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
              <Link href={`/admin/contracts/${contract.id}/edit`}>
                <Button
                  variant="default"
                  className="bg-green-100 text-green-600 hover:bg-green-200 p-1.5 h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent
              className="bg-green-100 text-green-600 rounded-md px-2 py-1 shadow-md tooltip-content"
              sideOffset={5}
            >
              Edit Contract
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 h-8 w-8"
                onClick={() => onOpenModal(contract.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-red-100 text-red-600 rounded-md px-2 py-1 shadow-md tooltip-content"
              sideOffset={5}
            >
              Delete Contract
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];