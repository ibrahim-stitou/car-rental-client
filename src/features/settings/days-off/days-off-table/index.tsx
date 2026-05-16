
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { DayOff, Country } from '@/features/settings/days-off/types';
import { useLanguage } from '@/context/LanguageContext';

interface DaysOffTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
  currentPage: number;
  perPage: number;
  lastPage: number;
  loading: boolean;
  error: string | null;
  search: string;
  countries: Country[];
  selectedCountry?: number | null;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  itemsLabel?: string;
}

export function DaysOffTable<TData, TValue>({
                                              data,
                                              totalItems,
                                              columns,
                                              currentPage,
                                              perPage,
                                              lastPage,
                                              loading,
                                              error,
                                              search,
                                              countries,
                                              selectedCountry,
                                              onSearchChange,
                                              onPageChange,
                                              onPerPageChange,
                                              itemsLabel = 'days off'
                                            }: DaysOffTableParams<TData, TValue>) {
  const { t } = useLanguage();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (data.length > 0 || !loading) {
      setInitialLoad(false);
    }
  }, [data, loading]);

  // Calculate pageCount for the table pagination
  const pageCount = Math.max(1, lastPage);

  // Create handlers for pagination and filtering changes
  const handlePaginationChange = (updater: any) => {
    const newState =
      typeof updater === 'function'
        ? updater({
          pageIndex: currentPage - 1,
          pageSize: perPage
        })
        : updater;

    // Only update if values actually changed
    if (newState.pageIndex + 1 !== currentPage) {
      onPageChange(newState.pageIndex + 1);
    }

    if (newState.pageSize !== perPage) {
      onPerPageChange(newState.pageSize);
    }
  };

  const handleGlobalFilterChange = (value: string) => {
    onSearchChange(value);
  };

  // Provide meta for the table
  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,
    initialState: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: perPage
      },
      globalFilter: search
    },
    // Use meta to pass additional parameters
    meta: {
      countries,
      manualPagination: true,
      totalItems: totalItems
    },
    onPaginationChange: handlePaginationChange,
    onGlobalFilterChange: handleGlobalFilterChange
  });

  // Ensure table state is synced with external state
  useEffect(() => {
    if (table) {
      // Sync pagination state with table
      table.setPagination({
        pageIndex: currentPage - 1,
        pageSize: perPage
      });

      // Sync filter state with table
      if (table.getState().globalFilter !== search) {
        table.setGlobalFilter(search);
      }
    }
  }, [table, currentPage, perPage, search]);

  if (initialLoad || loading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between gap-4'>
          <Skeleton className='h-10 w-[300px]' />
          <Skeleton className='h-10 w-[100px]' />
        </div>
        <div className='rounded-md border'>
          <div className='flex gap-4 p-4'>
            {Array.from({ length: columns.length }).map((_, i) => (
              <Skeleton key={`header-${i}`} className='h-6 flex-1' />
            ))}
          </div>
          <div className='space-y-2 p-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`row-${i}`} className='flex gap-4'>
                {Array.from({ length: columns.length }).map((_, j) => (
                  <Skeleton key={`cell-${i}-${j}`} className='h-8 flex-1' />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-[200px]' />
          <div className='flex gap-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`page-${i}`} className='h-8 w-8' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!countries || countries.length === 0) {
    return (
      <div className='py-10 text-center'>
        <p className='text-gray-500'>{t('admin.settings.daysOff.states.loadingCountries')}</p>
      </div>
    );
  }

  if (!selectedCountry) {
    return (
      <div className='py-10 text-center'>
        <p className='text-gray-500'>{t('admin.settings.daysOff.states.selectCountry')}</p>
      </div>
    );
  }

  // This is where we fix the "No results" message - we only show it when there truly are no days off
  if (!loading && data.length === 0) {
    return (
      <div className='py-5'>
        <div className='text-center py-8 px-3 rounded-md border border-dashed border-gray-200'>
          <p className='text-gray-500 font-medium'>{t('admin.settings.daysOff.states.noHolidays')}</p>
          <p className='text-gray-400 mt-1 text-sm'>{t('admin.settings.daysOff.states.addNewHoliday')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertTitle>{t('admin.settings.daysOff.states.error')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar
        table={table}
        searchPlaceholder={t('admin.settings.daysOff.search.placeholder', { itemsLabel })}
      />
    </DataTable>
  );
}