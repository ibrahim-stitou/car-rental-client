'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { useReservations, useDeleteReservation, useConfirmReservation, useActivateReservation, useCompleteReservation, useCancelReservation } from '../hooks/use-reservations';
import type { Reservation, ReservationStatus } from '@/types/reservation.types';
import { ReservationForm } from './reservation-form';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconDotsVertical, IconEdit, IconTrash, IconSearch, IconCheck, IconPlayerPlay, IconPlayerStop, IconX } from '@tabler/icons-react';
import { useDebounce } from '@/hooks/use-debounce';
import { format, parseISO } from 'date-fns';
import { RESERVATION_STATUS_OPTIONS } from '@/config/constants';

export function ReservationsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editRes, setEditRes] = useState<Reservation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const filters = useMemo(() => ({
    page, per_page: 15,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== 'all' && { status: statusFilter as ReservationStatus }),
  }), [page, debouncedSearch, statusFilter]);

  const { data, isLoading } = useReservations(filters);
  const { mutate: deleteRes, isPending: isDeleting } = useDeleteReservation();
  const { mutate: confirm } = useConfirmReservation();
  const { mutate: activate } = useActivateReservation();
  const { mutate: complete } = useCompleteReservation();
  const { mutate: cancel } = useCancelReservation();

  const handleConfirm = (id: string) => {
    confirm(id, {
      onSuccess: () => toast.success('Reservation confirmed'),
      onError: () => toast.error('Failed to confirm'),
    });
  };

  const handleActivate = (id: string) => {
    activate({ id, input: {} as any }, {
      onSuccess: () => toast.success('Reservation activated'),
      onError: () => toast.error('Failed to activate'),
    });
  };

  const handleComplete = (id: string) => {
    complete({ id, input: {} as any }, {
      onSuccess: () => toast.success('Reservation completed'),
      onError: () => toast.error('Failed to complete'),
    });
  };

  const handleCancel = (id: string) => {
    cancel({ id, input: { reason: 'Cancelled by admin' } as any }, {
      onSuccess: () => toast.success('Reservation cancelled'),
      onError: () => toast.error('Failed to cancel'),
    });
  };

  const columns: ColumnDef<Reservation>[] = [
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ getValue }) => <span className="font-mono text-sm font-medium">{getValue() as string}</span>,
    },
    {
      id: 'vehicle',
      header: 'Vehicle',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.vehicle?.full_name ?? '—'}</span>
      ),
    },
    {
      id: 'client',
      header: 'Client',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.client?.full_name ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'pickup_date',
      header: 'Pickup',
      cell: ({ getValue }) => (
        <span className="text-sm">{format(parseISO(getValue() as string), 'dd MMM yyyy')}</span>
      ),
    },
    {
      accessorKey: 'return_date',
      header: 'Return',
      cell: ({ getValue }) => (
        <span className="text-sm">{format(parseISO(getValue() as string), 'dd MMM yyyy')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ getValue }) => (
        <span className="font-medium">{Number(getValue()).toLocaleString('fr-MA')} MAD</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setEditRes(r); setFormOpen(true); }}>
                <IconEdit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              {r.status === 'pending' && (
                <DropdownMenuItem onClick={() => handleConfirm(r.id)}>
                  <IconCheck className="mr-2 h-4 w-4" /> Confirm
                </DropdownMenuItem>
              )}
              {r.status === 'confirmed' && (
                <DropdownMenuItem onClick={() => handleActivate(r.id)}>
                  <IconPlayerPlay className="mr-2 h-4 w-4" /> Activate
                </DropdownMenuItem>
              )}
              {r.status === 'active' && (
                <DropdownMenuItem onClick={() => handleComplete(r.id)}>
                  <IconPlayerStop className="mr-2 h-4 w-4" /> Complete
                </DropdownMenuItem>
              )}
              {['pending', 'confirmed'].includes(r.status) && (
                <DropdownMenuItem onClick={() => handleCancel(r.id)} className="text-destructive focus:text-destructive">
                  <IconX className="mr-2 h-4 w-4" /> Cancel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(r.id)}>
                <IconTrash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({ data: data?.data ?? [], columns, getCoreRowModel: getCoreRowModel(), manualPagination: true });
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader title="Reservations" description="Manage vehicle reservations" onAdd={() => { setEditRes(null); setFormOpen(true); }} addLabel="New Reservation" />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reservations…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {RESERVATION_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {meta && <span className="ml-auto text-sm text-muted-foreground">{meta.total} reservations</span>}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>{columns.map((_, j) => <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>)}</TableRow>
            )) : table.getRowModel().rows.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">No reservations found</TableCell></TableRow>
            ) : table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Page {meta.current_page} of {meta.last_page} · {meta.total} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <ReservationForm open={formOpen} onOpenChange={setFormOpen} reservation={editRes} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => {
          deleteRes(deleteId!, {
            onSuccess: () => { toast.success('Deleted'); setDeleteId(null); },
            onError: () => toast.error('Failed'),
          });
        }}
        isPending={isDeleting}
        title="Delete reservation?"
        description="This will permanently delete this reservation."
      />
    </div>
  );
}
