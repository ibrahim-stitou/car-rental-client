'use client';
import { create } from 'zustand';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

export interface ConsultantTimesheet {
  id: number;
  month: string;
  year: number;
  status: 'draft' | 'review' | 'validated' | 'corrected' | 'rejected';
  mission_id: number;
  days_nbr: number;
  days: Record<string, 'worked' | 'absent' | 'weekend' | 'vacation' | 'daysoff' | 'none'>;
  supporting_document_path?: string;
  absense: number;
  mission: {
    id: number;
    title: string;
    client_id: number;
  };
  consultant: {
    nom: string;
    prenom: string;
  };
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

interface ConsultantTimesheetStore {
  timesheets: ConsultantTimesheet[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  search: string;
  fetchTimesheets: () => Promise<void>;
  addTimesheet: (timesheet: Partial<ConsultantTimesheet>) => Promise<ConsultantTimesheet | null>;
  removeTimesheet: (id: number) => Promise<boolean>;
  setPagination: (pagination: Partial<Pagination>) => void;
  setSearch: (search: string) => void;
  updateTimesheet: (id: number, updatedData: Partial<ConsultantTimesheet>) => Promise<ConsultantTimesheet | null>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useConsultantTimesheetStore = create<ConsultantTimesheetStore>((set, get) => ({
  timesheets: [],
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    per_page: 10,
    last_page: 1,
    total: 0,
  },
  search: '',

  fetchTimesheets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(apiRoutes.consultant.timesheets.list, {
        params: {
          page: get().pagination.current_page,
          per_page: get().pagination.per_page,
          search: get().search,
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
      const response = await apiClient.post<ConsultantTimesheet>(apiRoutes.consultant.timesheets.create, timesheet);
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

  removeTimesheet: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(apiRoutes.consultant.timesheets.delete(id));
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

  updateTimesheet: async (id: number, updatedData: Partial<ConsultantTimesheet>) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<ConsultantTimesheet>(
        apiRoutes.consultant.timesheets.coriger(id),
        updatedData
      );
      set((state) => ({
        timesheets: state.timesheets.map((timesheet) =>
          timesheet.id === id ? { ...timesheet, ...response.data } : timesheet
        ),
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to update timesheet' });
      return null;
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