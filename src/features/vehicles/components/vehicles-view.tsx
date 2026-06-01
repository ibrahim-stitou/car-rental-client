'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  useReactTable, getCoreRowModel, flexRender, type ColumnDef,
} from '@tanstack/react-table';
import { useVehicles, useDeleteVehicle, useUpdateVehicleStatus } from '../hooks/use-vehicles';
import type { Vehicle, VehicleStatus } from '@/types/vehicle.types';
import { VehicleForm } from './vehicle-form';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  IconDotsVertical, IconEdit, IconTrash, IconCar, IconSearch,
} from '@tabler/icons-react';
import { useDebounce } from '@/hooks/use-debounce';
import { VEHICLE_STATUS_OPTIONS, VEHICLE_CATEGORY_OPTIONS } from '@/config/constants';

export function VehiclesView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const filters = useMemo(() => ({
    page,
    per_page: 15,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== 'all' && { status: statusFilter as VehicleStatus }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
  }), [page, debouncedSearch, statusFilter, categoryFilter]);

  const { data, isLoading } = useVehicles(filters);
  const { mutate: deleteVehicle, isPending: isDeleting } = useDeleteVehicle();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteVehicle(deleteId, {
      onSuccess: () => { toast.success('Vehicle deleted'); setDeleteId(null); },
      onError: () => toast.error('Failed to delete vehicle'),
    });
  };

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'full_name',
      header: 'Vehicle',
      cell: ({ row }) => {
        const v = row.original;
        const photo = v.photos?.[0]?.url;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-14 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
              {photo ? (
                <img src={photo} alt={v.full_name} className="h-full w-full object-cover" />
              ) : (
                <IconCar className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-medium text-sm">{v.brand} {v.model}</div>
              <div className="text-xs text-muted-foreground">{v.year} · {v.color}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'registration_number',
      header: 'Registration',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="capitalize">{getValue() as string}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: 'daily_rate',
      header: 'Rate/Day',
      cell: ({ getValue }) => (
        <span className="font-medium">{Number(getValue()).toLocaleString('fr-MA')} MAD</span>
      ),
    },
    {
      accessorKey: 'mileage',
      header: 'Mileage',
      cell: ({ getValue }) => (
        <span className="text-sm">{Number(getValue()).toLocaleString()} km</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const v = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setEditVehicle(v); setFormOpen(true); }}>
                <IconEdit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(v.id)}
              >
                <IconTrash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.meta.last_page ?? 1,
  });

  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Vehicles"
        description="Manage your vehicle fleet"
        onAdd={() => { setEditVehicle(null); setFormOpen(true); }}
        addLabel="Add Vehicle"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {VEHICLE_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {VEHICLE_CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {meta && (
          <span className="ml-auto text-sm text-muted-foreground">
            {meta.total} vehicle{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page} · {meta.total} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <VehicleForm open={formOpen} onOpenChange={setFormOpen} vehicle={editVehicle} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete vehicle?"
        description="This will permanently delete the vehicle. This action cannot be undone."
      />
    </div>
  );
}
