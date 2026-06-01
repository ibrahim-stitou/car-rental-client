'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  useReactTable, getCoreRowModel, flexRender, type ColumnDef,
} from '@tanstack/react-table';
import { useClients, useDeleteClient } from '../hooks/use-clients';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import type { Client } from '@/types/client.types';
import { ClientForm } from './client-form';
import { PageHeader } from '@/components/shared/page-header';
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
  IconDotsVertical, IconEdit, IconTrash, IconSearch, IconUsers,
} from '@tabler/icons-react';
import { useDebounce } from '@/hooks/use-debounce';

export function ClientsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [blacklistFilter, setBlacklistFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const filters = useMemo(() => ({
    page,
    per_page: 15,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(agencyFilter !== 'all' && { agency_id: agencyFilter }),
    ...(blacklistFilter !== 'all' && { is_blacklisted: blacklistFilter === 'blacklisted' }),
  }), [page, debouncedSearch, agencyFilter, blacklistFilter]);

  const { data, isLoading } = useClients(filters);
  const { data: agenciesRes } = useAgencies({ per_page: 100 });
  const agencies = agenciesRes?.data ?? [];
  const { mutate: deleteClient, isPending: isDeleting } = useDeleteClient();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteClient(deleteId, {
      onSuccess: () => { toast.success('Client deleted'); setDeleteId(null); },
      onError: () => toast.error('Failed to delete client'),
    });
  };

  const columns: ColumnDef<Client>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div>
            <div className="font-medium text-sm">{c.first_name} {c.last_name}</div>
            {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => (
        <span className="text-sm font-mono">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-sm">{(getValue() as string | null) ?? '—'}</span>
      ),
    },
    {
      id: 'agency',
      header: 'Agency',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.agency?.name ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'id_type',
      header: 'ID Type',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ? (
          <Badge variant="outline" className="text-xs">{v}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const c = row.original;
        return c.is_blacklisted ? (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 font-medium text-xs">
            Blacklisted
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 font-medium text-xs">
            Active
          </Badge>
        );
      },
    },
    {
      accessorKey: 'reservations_count',
      header: 'Reservations',
      cell: ({ getValue }) => (
        <span className="text-sm">{(getValue() as number | undefined) ?? 0}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const c = row.original;
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
              <DropdownMenuItem onClick={() => { setEditClient(c); setFormOpen(true); }}>
                <IconEdit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(c.id)}
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
        title="Clients"
        description="Manage your client database"
        onAdd={() => { setEditClient(null); setFormOpen(true); }}
        addLabel="Add Client"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <Select value={agencyFilter} onValueChange={(v) => { setAgencyFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Agency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agencies</SelectItem>
            {agencies.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={blacklistFilter} onValueChange={(v) => { setBlacklistFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blacklisted">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
        {meta && (
          <span className="ml-auto text-sm text-muted-foreground">
            {meta.total} client{meta.total !== 1 ? 's' : ''}
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
                  <IconUsers className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  No clients found
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

      <ClientForm open={formOpen} onOpenChange={setFormOpen} client={editClient} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete client?"
        description="This will permanently delete the client. This action cannot be undone."
      />
    </div>
  );
}
