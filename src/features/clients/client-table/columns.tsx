'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Client {
  id: number;
  name: string;
  mail: string;
  phone?: string;
  country:{
    nom: string;
  }
  status: 'active' | 'inactive';
  idnumber: string;
}
export const clientColumns = ({
                                onOpenModal,
                              }: {
  onOpenModal: (id: number) => void;
}): ColumnDef<Client, unknown>[] => [
  {
    accessorKey: 'N°',
    header: () => <div className="text-center">N°</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.id}</div>,
  },
  {
    accessorKey: 'name',
    header: () => <div className="text-center">Name</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.name}</div>,
  },
  {
    accessorKey: 'mail',
    header: () => <div className="text-center">Email</div>,
    cell: ({ row }) => <div className="text-center">{row.original.mail}</div>,
  },
  {
    accessorKey: 'phone',
    header: () => <div className="text-center">Phone</div>,
    cell: ({ row }) => <div className="text-center">{row.original.phone || '-'}</div>,
  },
  {
    accessorKey: 'idnumber', // New column for idnumber
    header: () => <div className="text-center">Identifier</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.idnumber}</div>,
  },
  {
    accessorKey: 'countru', // New column for idnumber
    header: () => <div className="text-center">Country</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.country.nom}</div>,
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

      return (
        <div className="text-center">
          <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const client = row.original;

      return (
        <div className="flex justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/clients/${client.id}/show`}>
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
              <Link href={`/admin/clients/${client.id}/edit`}>
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
              Edit Client
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 h-8 w-8"
                onClick={() => onOpenModal(client.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-red-100 text-red-600 rounded-md px-2 py-1 shadow-md tooltip-content"
              sideOffset={5}
            >
              Delete Client
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];