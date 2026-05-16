'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


export const userColumns = ({
                              onOpenModal,
                            }: {
  onOpenModal: (id: number) => void;
  //@ts-ignore
}): ColumnDef<User, unknown>[] => [
  {
    accessorKey: 'N°',
    header: () => <div className="text-center">N°</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.id}</div>,
  },
  {
    accessorKey: 'firstname',
    header: () => <div className="text-center">First name</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.prenom}</div>,
    enableColumnFilter: true,
    meta:{
      variant:"text",
      label:"Firstname",
      placeholder: 'Filter by first name',
    }
  },
  {
    accessorKey: 'lastname',
    header: () => <div className="text-center">Last name</div>,
    cell: ({ row }) => <div className="font-medium text-center">{row.original.nom}</div>,
    enableColumnFilter: true,
    meta: {
      variant: 'text',
      label: 'Last name',
      placeholder: 'Filter by last name',
    },
  },
  {
    accessorKey: 'email',
    header: () => <div className="text-center">Email</div>,
    cell: ({ row }) => <div className="text-center">{row.original.email}</div>,
    enableColumnFilter: true,
    meta: {
      variant: 'text',
      label: 'Email',
      placeholder: 'Filter by email',
    },
  },
  {
    accessorKey: 'phone',
    header: () => <div className="text-center">Phone</div>,
    cell: ({ row }) => <div className="text-center">{row.original.telephone || '-'}</div>,
  },
  {
    accessorKey: 'gender',
    header: () => <div className="text-center">Gender</div>,
    cell: ({ row }) => {
      const genderMap: Record<string, string> = {
        M: 'Male',
        F: 'Female',
        Autre: 'Other',
      };

      return (
        <div className="text-center">
          {genderMap[row.original.sexe] || '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: () => <div className="text-center">Role</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant={row.original.role.code === 'admin' ? 'destructive' : 'secondary'}>
          {row.original.role.name}
        </Badge>
      </div>
    ),
    enableColumnFilter: true,
    meta: {
      variant: 'select',
      label: 'Role',
      placeholder: 'Select a role',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Consultant', value: 'consultant' },
      ],
    },
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-600',
        pending: 'bg-yellow-100 text-yellow-600',
        suspended: 'bg-red-100 text-red-600',
      };

      return (
        <div className="text-center">
          <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
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
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const user = row.original;

      return (
        <>
          <div className="flex justify-center gap-2">
            {/* View Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/admin/users/${user.id}/show`}>
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

            {/* Edit Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/admin/users/${user.id}/edit`}>
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
                Edit User
              </TooltipContent>
            </Tooltip>

            {/* Delete Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 h-8 w-8"
                  onClick={() => onOpenModal(user.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-red-100 text-red-600 rounded-md px-2 py-1 shadow-md tooltip-content"
                sideOffset={5}
              >
                Delete User
              </TooltipContent>
            </Tooltip>
          </div>
        </>
      );
    },
  },
];