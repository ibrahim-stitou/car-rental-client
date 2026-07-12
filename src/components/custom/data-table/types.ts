import { FieldValues, UseFormReturn } from 'react-hook-form';
import React, { ReactElement } from 'react';

export interface CustomTableFilterConfig {
  field: string;
  label: string;
  defaultValue?: any;
  type?: 'text' | 'number' | 'date' | 'select' | 'checkbox'  |  'datatable-select' | 'datatable-multiselect' | 'custom';
  options?: { label: string; value: any }[];
  group?: 'primary' | 'secondary' | 'date' | 'advanced';
  order?: number;
  hidden?: boolean;
  render?: (form: UseFormReturn<Record<string, any>>) => ReactElement;
}

export interface CustomTableColumn<T> {
  data: keyof T | string;
  label: string;
  sortable: boolean;
  render?: (value: any, row: T, refresh: () => void) => React.ReactNode;
  width?: number;
}

export interface CustomTableBulkAction<T> {
  label: string;
  icon: string;
  color?: string;
  action: (selected: T[], refresh: () => void) => void;
  disabled?: (selected: T[]) => boolean;
}

export interface ToolbarAction {
  label: string;
  icon: string;
  onClick: () => void;
  showOnDesktop?: boolean;
  showOnMobileFab?: boolean;
  color?: string;
  disabled?: boolean;
}

export interface ExternalAction<T> {
  label: string;
  icon: string;
  onClick: (row: T, refresh: () => void) => void;
  disabled?: (row: T) => boolean;
  color?: string;
  showOnSelected?: boolean;
  refresh?: () => void;
}

export interface CustomTableTableState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pages: number;
  currentPage: number;
  rowsPerPage: number;
  recordCount: number;
  sortBy: keyof T | null;
  sortDir: 'asc' | 'desc';
  selectedRows: T[];
  visibleColumns: (keyof T)[];
  filters: Record<string, any>;
}

export interface CustomTableProps<T> {
  url: string;
  columns: CustomTableColumn<T>[];
  bulkActions?: CustomTableBulkAction<T>[];
  toolbarActions?: ToolbarAction[];
  externalActions?: ExternalAction<T>[];
  initialState?: Partial<CustomTableTableState<T>>;
  title?: string;
  titleExtra?: React.ReactNode;
  onInit?: (tableInstance: Partial<UseTableReturn<T>> & {
    setSelectedRows: <T>(rows: T[]) => void;
    onSort: <T>(column: keyof T) => void;
    setData: <T>(data: T[]) => void;
    setVisibleColumns: <T>(columns: (keyof T)[]) => void;
    setFilters: (filters: Record<string, any>) => void;
    setCurrentPage: (page: number) => void;
    refresh: () => void;
    setRowsPerPage: (rowsPerPage: number) => void;
    onSelect: <T>(event: React.ChangeEvent<HTMLInputElement>, row: T) => void
  }) => void;
  onReset?: () => void;
  onSubmit?: (values: any) => void;
  filters?: CustomTableFilterConfig[];
  sortBy?: keyof T;
  sortDir?: 'asc' | 'desc';
  rowClassName?: (row: T) => string;
}


export interface MobilePaginationProps {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onLoadMore: () => Promise<void>;
  totalItems: number;
  loadedItems: number;
}

export interface UseTableReturn<T> extends CustomTableTableState<T> {
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rowsPerPage: number) => void;
  setVisibleColumns: (columns: (keyof T)[]) => void;
  setFilters: (filters: Record<string, any>) => void;
  onSort: (column: keyof T) => void;
  onSelect: (event: React.ChangeEvent<HTMLInputElement>, row: T) => void;
  onSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
  refresh: () => void;
}

export interface MobileDataState<T> {
  data: T[];
  isLoading: boolean;
  hasMore: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: SortDirection;
  [key: string]: any;
}

export interface CustomTableResponse<T> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
  [key: string]: any;
}

// Type definition for the return value of useCustomTable
export type UseCustomTableReturnType<T extends Record<string, any>> = {
  data: T[];
  loading: boolean;
  error: string | null;
  pages: number;
  currentPage: number;
  rowsPerPage: number;
  recordCount: number;
  sortBy: keyof T | null;
  sortDir: 'asc' | 'desc';
  selectedRows: T[];
  visibleColumns: (keyof T)[];
  filters: Record<string, any>;
  columns: CustomTableColumn<T>[];
  bulkActions: CustomTableBulkAction<T>[];
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rowsPerPage: number) => void;
  onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>, row: T) => void;
  onSelectAllRows: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSort: (column: keyof T) => void;
  onFilter: (filterData: FieldValues) => void;
  setVisibleColumns: (columns: (keyof T)[]) => void;
  refresh: () => Promise<void>;
};

// Type definition for the useCustomTable hook itself
export type UseCustomTableHook = <T extends Record<string, any>>(
  url: string,
  columns: CustomTableColumn<T>[],
  bulkActions?: CustomTableBulkAction<T>[],
  initialState?: Partial<CustomTableTableState<T>>
) => UseCustomTableReturnType<T>;