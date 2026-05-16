'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {  Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Timesheet } from '@/stores/timesheet-store';
import { formatDate } from '@/lib/format';
export const timesheetColumns = ({
                                   onOpenModal,
                                 }: {
  onOpenModal: (id: number) => void;
}): ColumnDef<Timesheet, unknown>[] => [
  {
    accessorKey: 'id',
    header: () => <div className="text-center">N°</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.id}</div>,
  },
  {
    accessorKey: 'month',
    header: () => <div className="text-center">Month</div>,
    cell: ({ row }) => <div className="text-center">{row.original.month}</div>,
  },
  {
    accessorKey: 'year',
    header: () => <div className="text-center">Year</div>,
    cell: ({ row }) => <div className="text-center">{row.original.year}</div>,
  },
  {
    accessorKey: 'consultant',
    header: () => <div className="text-center">Consultant</div>,
    cell: ({ row }) => {
      const consultant = row.original.consultant;
      const fullName = consultant ? `${row.original.consultant.nom} ${row.original.consultant.prenom}` : '---';
      return <div className="text-center">{fullName}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        new: 'bg-yellow-100 text-yellow-600',
        approved: 'bg-green-100 text-green-600',
        rejected: 'bg-red-100 text-red-600',
      };

      const statusDisplay: Record<string, string> = {
        new: 'New',
        approved: 'Approved',
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
    accessorKey: 'mission',
    header: () => <div className="text-center">Mission</div>,
    cell: ({ row }) => <div className="text-center">{row.original.mission?.title || 'N/A'}</div>,
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const timesheet = row.original;

      return (
        <div className="flex justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/timesheets/${timesheet.id}/show`}>
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
                onClick={() => onOpenModal(timesheet.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-red-100 text-red-600 rounded-md px-2 py-1 shadow-md tooltip-content"
              sideOffset={5}
            >
              Delete Timesheet
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];