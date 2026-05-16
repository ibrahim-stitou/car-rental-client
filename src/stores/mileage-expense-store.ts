'use client';
import { create } from 'zustand';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

export interface MileageExpense {
  id: number;
  consultant_id: number;
  mission_id: number;
  amount_ttc: string;
  total_km: number;
  status: 'pending' | 'validated' | 'rejected';
  month: number;
  year: number;
  validated_at: string | null;
  consultant: {
    id: number;
    nom: string;
    prenom: string;
    full_name: string;
    profile_image_url: string;
    email: string;
  };
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

interface MileageExpenseStore {
  mileageExpenses: MileageExpense[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  search: string;
  fetchMileageExpenses: () => Promise<void>;
  removeMileageExpense: (id: number) => Promise<boolean>;
  validateMileageExpense: (id: number) => Promise<MileageExpense | null>;
  rejectMileageExpense: (id: number) => Promise<MileageExpense | null>;
  setPagination: (pagination: Partial<Pagination>) => void;
  setSearch: (search: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useMileageExpenseStore = create<MileageExpenseStore>((set, get) => ({
  mileageExpenses: [],
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    per_page: 10,
    last_page: 1,
    total: 0,
  },
  search: '',

  fetchMileageExpenses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(apiRoutes.admin.mileageExpenses.list, {
        params: {
          page: get().pagination.current_page,
          per_page: get().pagination.per_page,
          search: get().search,
        },
      });
      set({
        mileageExpenses: response.data.data.data,
        pagination: {
          current_page: response.data.data.current_page,
          per_page: response.data.data.per_page,
          last_page: response.data.data.last_page,
          total: response.data.data.total,
        },
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to fetch mileage expenses' });
    }
  },

  removeMileageExpense: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(apiRoutes.admin.mileageExpenses.delete(id));
      set((state) => ({
        mileageExpenses: state.mileageExpenses.filter((m) => m.id !== id),
        loading: false,
      }));
      return true;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to delete mileage expense' });
      return false;
    }
  },

  validateMileageExpense: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<MileageExpense>(apiRoutes.admin.mileageExpenses.approve(id));
      set((state) => ({
        mileageExpenses: state.mileageExpenses.map((m) => (m.id === id ? { ...m, status: 'validated', validated_at: new Date().toISOString() } : m)),
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to validate mileage expense' });
      return null;
    }
  },

  rejectMileageExpense: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<MileageExpense>(apiRoutes.admin.mileageExpenses.reject(id));
      set((state) => ({
        mileageExpenses: state.mileageExpenses.map((m) => (m.id === id ? { ...m, status: 'rejected' } : m)),
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to reject mileage expense' });
      return null;
    }
  },

  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
    get().fetchMileageExpenses();
  },

  setSearch: (search) => {
    set({ search });
    get().fetchMileageExpenses();
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));