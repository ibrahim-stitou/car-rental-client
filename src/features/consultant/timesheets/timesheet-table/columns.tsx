'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConsultantTimesheet } from '@/stores/consultant/timesheet-store';
import { formatDate } from '@/lib/format';

export const consultantTimesheetColumns = (missionOptions: { label: string; value: string }[]): ColumnDef<ConsultantTimesheet, unknown>[] => {
  return [
    {
      accessorKey: 'mission',
      header: () => <div className="text-center">Mission</div>,
      cell: ({ row }) => <div className="text-center">{row.original.mission?.title || 'N/A'}</div>,
      enableColumnFilter: true,
      meta: {
        variant: 'select',
        label: 'Mission',
        placeholder: 'Select a mission',
        options: missionOptions,
      },
    },
    {
      accessorKey: 'month',
      header: () => <div className="text-center">Month</div>,
      cell: ({ row }) => {
        const monthNumber = parseInt(row.original.month, 10);
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(0, monthNumber - 1));
        return <div className="text-center">{monthName}</div>;
      },
      enableColumnFilter: true,
      meta: {
        variant: 'select',
        label: 'Month',
        placeholder: 'Select a month',
        options: Array.from({ length: 12 }, (_, i) => ({
          label: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(0, i)),
          value: (i + 1).toString(),
        })),
      },
    },
    {
      accessorKey: 'year',
      header: () => <div className="text-center">Year</div>,
      cell: ({ row }) => <div className="text-center">{row.original.year}</div>,
      enableColumnFilter: true,
      meta: {
        variant: 'select',
        label: 'Year',
        placeholder: 'Select a year',
        options: Array.from({ length: 10 }, (_, i) => {
          const year = new Date().getFullYear() - i;
          return { label: year.toString(), value: year.toString() };
        }),
      },
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColors: Record<string, string> = {
          draft: 'bg-gray-100 text-gray-600',
          review: 'bg-yellow-100 text-yellow-600',
          validated: 'bg-green-100 text-green-600',
          corrected: 'bg-blue-100 text-blue-600',
          rejected: 'bg-red-100 text-red-600',
        };

        const statusDisplay: Record<string, string> = {
          draft: 'Draft',
          review: 'In Review',
          validated: 'Validated',
          corrected: 'Corrected',
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
      enableColumnFilter: true,
      meta: {
        variant: 'select',
        label: 'Status',
        placeholder: 'Select a status',
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'In Review', value: 'review' },
          { label: 'Validated', value: 'validated' },
          { label: 'Corrected', value: 'corrected' },
          { label: 'Rejected', value: 'rejected' },
        ],
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
        const timesheet = row.original;

        return (
          <div className="flex justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/consultant/timesheets/${timesheet.id}/show`}>
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