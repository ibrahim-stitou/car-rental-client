import type React from "react";
import type {AxiosResponse} from "axios";
import type {FieldValues} from "react-hook-form";

import {useMemo, useState, useEffect, useCallback} from "react";
import apiClient from '@/lib/api';
import {
  CustomTableBulkAction,
  CustomTableColumn,
  CustomTableResponse,
  CustomTableTableState
} from '@/components/custom/data-table/types';

export const useCustomTable = <T extends Record<string, any>>(
  url: string,
  columns: CustomTableColumn<T>[],
  bulkActions: CustomTableBulkAction<T>[] = [],
  initialState: Partial<CustomTableTableState<T>> = {}
) => {
  const [state, setState] = useState<CustomTableTableState<T>>({
    data: [],
    loading: false,
    error: null,
    pages: 0,
    currentPage: 0,
    rowsPerPage: 10,
    recordCount: 0,
    sortBy: null,
    sortDir: 'asc',
    selectedRows: [],
    visibleColumns: columns.map((column) => column.data),
    filters: {},
    ...initialState,
  });

  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({...prev, loading: true, error: null}));
      const config = {
        params: {
          ...state.filters,
          // Laravel pagination params (page-based)
          page: state.currentPage + 1,
          per_page: state.rowsPerPage,
          // Also send DataTables params for backward compat
          start: state.currentPage * state.rowsPerPage,
          length: state.rowsPerPage,
          ...(state.sortBy ? { sort_by: state.sortBy, sortBy: state.sortBy } : {}),
          ...(state.sortDir ? { sort_dir: state.sortDir, sortDir: state.sortDir } : {}),
        },
      };
      const response: AxiosResponse<any> = await apiClient.get(url, config);
      const resData = response.data;

      // Support both Laravel pagination format and DataTables format
      const laravelMeta = resData.meta;
      const pagination = laravelMeta?.pagination ?? laravelMeta;
      const total = pagination?.total ?? resData.recordsTotal ?? resData.recordsFiltered ?? 0;
      const lastPage = pagination?.last_page ?? pagination?.total_pages
        ?? (total > 0 ? Math.ceil(total / state.rowsPerPage) : 1);

      setState((prev) => ({
        ...prev,
        data: resData.data ?? [],
        pages: lastPage,
        recordCount: total,
        loading: false,
        selectedRows: [],
      }));
    } catch (error: any) {
      setState((prev) => ({...prev, error: error.message, loading: false}));
    }
  }, [url, state.filters, state.currentPage, state.rowsPerPage, state.sortBy, state.sortDir]);

  useEffect(() => {
    fetchData().then(() => null );
  }, [fetchData]);

  const onCheckboxChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, row: T) => {
    setState((prev) => ({
      ...prev,
      selectedRows: event.target.checked
        ? [...prev.selectedRows, row]
        : prev.selectedRows.filter((selectedRow) => selectedRow !== row),
    }));
  }, []);

  const onSelectAllRows = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({
      ...prev,
      selectedRows: event.target.checked ? [...prev.data] : [],
    }));
  }, []);

  const onSort = useCallback((column: keyof T) => {
    setState((prev) => ({
      ...prev,
      sortBy: column,
      sortDir: prev.sortBy === column && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const onFilter = useCallback((filterData: FieldValues) => {
    const filteredData = Object.fromEntries(
      Object.entries(filterData).filter(([, value]) => value !== "" && value !== null && value !== undefined)
    );
    setState((prev) => ({...prev, filters: filteredData, currentPage: 0}));
  }, []);
  const setFilters = useCallback((filters: FieldValues) => {
    setState((prev) => ({
      ...prev,
      filters,
      currentPage: 0, // Reset to the first page when filters change
    }));
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const setVisibleColumns = useCallback((columns: (keyof T)[]) => {
    setState((prev) => ({...prev, visibleColumns: columns}));
  }, []);

  const tableActions = useMemo(() => ({
    setCurrentPage: (page: number) => setState((prev) => ({...prev, currentPage: page})),
    setRowsPerPage: (rowsPerPage: number) => setState((prev) => ({...prev, rowsPerPage, currentPage: 0})),
    onCheckboxChange,
    onSelectAllRows,
    onSort,
    onFilter,
    setVisibleColumns,
    refresh: fetchData,
    setFilters
  }), [onCheckboxChange, onSelectAllRows, onSort, onFilter, setVisibleColumns, fetchData]);



  return {
    ...state,
    columns,
    bulkActions,
    ...tableActions,
  };
};
