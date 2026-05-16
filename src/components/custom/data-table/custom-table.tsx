import React, { useEffect } from 'react';
import { useCustomTable } from '@/hooks/use-custom-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import { Skeleton } from '@/components/ui/skeleton';
import CustomTablePagination from '@/components/custom/data-table/custom-table-pagination';
import { CustomTableProps } from '@/components/custom/data-table/types';
import { CustomTableToolbar } from '@/components/custom/data-table/custom-table-toolbar';
import { useLanguage } from '@/context/LanguageContext';
import { IconLoader } from '@tabler/icons-react';

const CustomTable = <T extends Record<string, any>>({
  url,
  columns,
  filters,
  onInit
                                                    }: CustomTableProps<T>) => {
  const table= useCustomTable(url, columns);
  const { t } = useLanguage();
  useEffect(() => {
    if (onInit) {
      // @ts-ignore
      onInit(table);
    }
  },[]);
  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className={0 ? 'hidden' : ''}>
        <CustomTableToolbar table={table} filters={filters} />
      </div>
      {!!0 && (
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
      )}
      {!0 && (
        <>
          <div className='relative flex flex-1'>
            {table.loading && (
              <div className='bg-accent absolute inset-0 z-50 flex h-full w-full items-center justify-center rounded-lg border opacity-40'>
                <IconLoader className='animate-spin' />
              </div>
            )}

            <div
              className={`absolute inset-0 flex overflow-hidden rounded-lg border ${table.loading && 'blur-sm'}`}
            >
              <ScrollArea className='h-full w-full'>
                <Table>
                  <TableHeader className='bg-muted sticky top-0 z-10'>
                    <TableRow>
                      {table.columns.map(
                        (col) =>
                          // @ts-ignore
                          table.visibleColumns.includes(col.data) && (
                            <TableHead
                              // @ts-ignore
                              key={col.data}
                              colSpan={col.width ? +col.width : 1}
                            >
                              {col.label}
                            </TableHead>
                          )
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.data?.length ? (
                      table.data.map((row) => (
                        <TableRow key={row.id}>
                          {table.columns.map(
                            (col) =>
                              // @ts-ignore
                              table.visibleColumns.includes(col.data) &&
                              // @ts-ignore
                              (col.render ? (
                                <TableCell
                                  // @ts-ignore
                                  key={col.data + '-' + row.id}
                                  colSpan={col.width ? +col.width : 1}
                                >
                                  {col.render(
                                    row[col.data],
                                    row,
                                    table.refresh
                                  )}
                                </TableCell>
                              ) : (
                                <TableCell
                                  // @ts-ignore
                                  key={`${col.data}-${row.id}`}
                                  colSpan={col.width ? +col.width : 1}
                                >
                                  {/*@ts-ignore*/}
                                  {row[col.data] ?? ''}
                                </TableCell>
                              ))
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={table.visibleColumns.length ?? 0}
                          className='h-24 text-center'
                        >
                          {t('dataTable.noData')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation='horizontal' />
              </ScrollArea>
            </div>
          </div>
          <CustomTablePagination<T> table={table} />
        </>
      )}
    </div>
  );
};
export default CustomTable;
