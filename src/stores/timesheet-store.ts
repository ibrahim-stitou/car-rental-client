'use client';
import { create } from 'zustand';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

export interface Timesheet {
  id: number;
  month: string;
  year: number;
  status: 'draft' | 'review' | 'validated' | 'corrected' | 'rejected';
  mission_id: number;
  days_nbr: number;
  absense: number;
  mission: {
    id: number;
    title: string;
    client_id: number;
  };
  consultant:{
    nom:string;
    prenom:string;
  }
  user_id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

interface Pagination {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

interface TimesheetStore {
  timesheets: Timesheet[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  search: string; // Add search property
  fetchTimesheets: () => Promise<void>;
  addTimesheet: (timesheet: Partial<Timesheet>) => Promise<Timesheet | null>;
  updateTimesheet: (id: number, timesheet: Partial<Timesheet>) => Promise<Timesheet | null>;
  removeTimesheet: (id: number) => Promise<boolean>;
  setPagination: (pagination: Partial<Pagination>) => void;
  setSearch: (search: string) => void; // Add setSearch method
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useTimesheetStore = create<TimesheetStore>((set, get) => ({
  timesheets: [],
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    per_page: 10,
    last_page: 1,
    total: 0,
  },
  search: '', // Initialize search property

  fetchTimesheets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(apiRoutes.admin.timesheets.list, {
        params: {
          page: get().pagination.current_page,
          per_page: get().pagination.per_page,
          search: get().search, // Include search in API request
        },
      });
      set({
        timesheets: response.data.data.data,
        pagination: {
          current_page: response.data.data.current_page,
          per_page: response.data.data.per_page,
          last_page: response.data.data.last_page,
          total: response.data.data.total,
        },
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to fetch timesheets' });
    }
  },

  addTimesheet: async (timesheet) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Timesheet>(apiRoutes.admin.timesheets.create, timesheet);
      set((state) => ({
        timesheets: [...state.timesheets, response.data],
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to add timesheet' });
      return null;
    }
  },

  updateTimesheet: async (id, timesheet) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<Timesheet>(apiRoutes.admin.timesheets.update(id), timesheet);
      set((state) => ({
        timesheets: state.timesheets.map((t) => (t.id === id ? response.data : t)),
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to update timesheet' });
      return null;
    }
  },

  removeTimesheet: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(apiRoutes.admin.timesheets.delete(id));
      set((state) => ({
        timesheets: state.timesheets.filter((t) => t.id !== id),
        loading: false,
      }));
      return true;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to delete timesheet' });
      return false;
    }
  },

  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
    get().fetchTimesheets();
  },

  setSearch: (search) => {
    set({ search });
    get().fetchTimesheets();
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));