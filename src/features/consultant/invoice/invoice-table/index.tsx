'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface InvoiceTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
  currentPage: number;
  perPage: number;
  lastPage: number;
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onColumnFiltersChange: (columnId: string, filterValue: string) => void;
}

export function InvoiceTable<TData, TValue>({
                                              data,
                                              totalItems,
                                              columns,
                                              currentPage,
                                              perPage,
                                              loading,
                                              error,
                                              search,
                                              onSearchChange,
                                              onPageChange,
                                              onPerPageChange,
                                              onColumnFiltersChange,
                                            }: InvoiceTableParams<TData, TValue>) {
  const [pageSize, setPageSize] = useQueryState(
    'perPage',
    parseAsInteger.withDefault(10)
  );
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [initialLoad, setInitialLoad] = useState(true);

  // Get initial column filters from URL
  const [urlParams] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  // Extract column filter names from columns.tsx
  const filterableColumns = columns.filter(col =>
    // @ts-ignore - meta is not in the type definition but we're using it
    col.enableColumnFilter && col.meta?.variant === 'select' && col.accessorKey
  );

  // Initial column filters state
  const initialColumnFilters = filterableColumns.map(col => {
    const columnId = (col as any).accessorKey as string;
    const value = urlParams.get(columnId) || '';
    return { id: columnId, value };
  });

  // Make sure data is an array, even if empty
  const safeData = Array.isArray(data) ? data : [];
  const columnsLength = columns ? columns.length : 0;

  useEffect(() => {
    if (safeData.length > 0 && !loading) {
      setInitialLoad(false);
    }
  }, [safeData, loading]);

  useEffect(() => {
    if (page !== currentPage) {
      onPageChange(page);
    }
    if (pageSize !== perPage) {
      onPerPageChange(pageSize);
    }
  }, [page, pageSize, currentPage, perPage, onPageChange, onPerPageChange]);

  useEffect(() => {
    if (!loading) {
      setInitialLoad(false);
    }
  }, [loading]);

  const pageCount = Math.ceil(totalItems / perPage) || 1;

  const { table } = useDataTable({
    data: safeData,
    columns,
    pageCount,
    shallow: false,
    //@ts-ignore
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: perPage,
      },
      globalFilter: search,
      columnFilters: initialColumnFilters,
    },
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === 'function'
          ? updater({
            pageIndex: currentPage - 1,
            pageSize: perPage,
          })
          : updater;
      setPage(newState.pageIndex + 1);
      setPageSize(newState.pageSize);
    },
    onGlobalFilterChange: onSearchChange,
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function'
        // @ts-ignore
        ? updater(table.getState().columnFilters)
        : updater;

      // Handle each changed filter
      if (Array.isArray(newFilters)) {
        const lastChangedFilter = newFilters[newFilters.length - 1];
        if (lastChangedFilter) {
          onColumnFiltersChange(lastChangedFilter.id, lastChangedFilter.value as string);
        }
      }
    },
  });

  if (initialLoad || loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="rounded-md border">
          <div className="flex gap-4 p-4">
            {Array.from({ length: columnsLength || 7 }).map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-6 flex-1" />
            ))}
          </div>
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`row-${i}`} className="flex gap-4">
                {Array.from({ length: columnsLength || 7 }).map((_, j) => (
                  <Skeleton key={`cell-${i}-${j}`} className="h-8 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`page-${i}`} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!loading && safeData.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500">No invoices found.</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}