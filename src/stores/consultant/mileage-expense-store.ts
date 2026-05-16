'use client';
import { create } from 'zustand';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

export interface MileageExpense {
  id: number;
  consultant_id: number;
  amount_ttc: number;
  status: 'draft' | 'pending' | 'rejected' | 'validated';
  month: number;
  year: number;
  total_km: number;
  mission: {
    id: number;
    title: string;
    client_id: number;
  };
  validated_at: string | null;
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
  addMileageExpense: (expense: Partial<MileageExpense>) => Promise<MileageExpense | null>;
  updateMileageExpense: (id: number, expense: Partial<MileageExpense>) => Promise<MileageExpense | null>;
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
      const response = await apiClient.get(apiRoutes.consultant.mileageExpenses.list, {
        params: {
          page: get().pagination.current_page,
          per_page: get().pagination.per_page,
          search: get().search,
        },
      });

      const expenses = response.data?.data || [];
      const meta = response.data?.meta || {};

      set({
        mileageExpenses: Array.isArray(expenses) ? expenses : [],
        pagination: {
          current_page: meta.current_page || 1,
          per_page: meta.per_page || 10,
          last_page: meta.last_page || 1,
          total: meta.total || 0,
        },
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to fetch mileage expenses' });
    }
  },

  addMileageExpense: async (expense) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<MileageExpense>(apiRoutes.consultant.mileageExpenses.create, expense);
      set((state) => ({
        mileageExpenses: [...state.mileageExpenses, response.data],
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to add mileage expense' });
      return null;
    }
  },

  updateMileageExpense: async (id, expense) => {
    set({ loading: true, error: null });
    try {
      const updateUrl = `${apiRoutes.consultant.mileageExpenses.list}/${id}`;
      const response = await apiClient.put<MileageExpense>(updateUrl, expense);
      set((state) => ({
        mileageExpenses: state.mileageExpenses.map((e) => (e.id === id ? response.data : e)),
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to update mileage expense' });
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