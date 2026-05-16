'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Mission } from '@/stores/mision-store';
import { formatDate } from '@/lib/format';


export const missionColumns = ({
  onOpenModal,
}: {
  onOpenModal: (id: number) => void;
}): ColumnDef<Mission, unknown>[] => [
  {
    accessorKey: 'id',
    header: () => <div className="text-center">N°</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.id}</div>,
  },
  {
    accessorKey: 'title',
    header: () => <div className="text-center">Title</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.title}</div>,
  },
  {
    accessorKey: 'client',
    header: () => <div className="text-center">Client</div>,
    //@ts-ignore
    cell: ({ row }) => <div className="text-center">{row.original.client.name}</div>,
  },
  {
    accessorKey: 'dates',
    header: () => <div className="text-center">Period</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {formatDate(row.original.date_debut)} - {formatDate(row.original.date_fin)}
      </div>
    ),
  },
  {
    accessorKey: 'tjm',
    header: () => <div className="text-center">TJM</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.tjm} € ({row.original.tjm_type === 'forfait' ? 'Fixed' : 'Daily'})
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-600',
        inactive: 'bg-red-100 text-red-600',
      };

      const statusDisplay: Record<string, string> = {
        active: 'Active',
        inactive: 'Inactive',
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
      const mission = row.original;

      return (
        <div className="flex justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/missions/${mission.id}/show`}>
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
              <Link href={`/admin/missions/${mission.id}/edit`}>
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
              Edit Mission
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 h-8 w-8"
                onClick={() => onOpenModal(mission.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-red-100 text-red-600 rounded-md px-2 py-1 shadow-md tooltip-content"
              sideOffset={5}
            >
              Delete Mission
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];