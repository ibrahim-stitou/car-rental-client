'use client';
import { create } from 'zustand';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

export interface ConsultantExpense {
  id: number;
  consultant_id: number;
  mission_id: number;
  month: string;
  year: string;
  total_ttc: string;
  validated_at: string | null;
  commentaire: string;
  status: 'draft' | 'pending' | 'validated' | 'rejected';
  deleted_at?: string | null;
  created_at: string;
  updated_at: string | null;
  mission: {
    id: number;
    title: string;
  };
}

interface Pagination {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

interface ConsultantExpenseStore {
  expenses: ConsultantExpense[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  search: string;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Partial<ConsultantExpense>) => Promise<ConsultantExpense | null>;
  updateExpense: (id: number, expense: Partial<ConsultantExpense>) => Promise<ConsultantExpense | null>;
  removeExpense: (id: number) => Promise<boolean>;
  setPagination: (pagination: Partial<Pagination>) => void;
  setSearch: (search: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useConsultantExpenseStore = create<ConsultantExpenseStore>((set, get) => ({
  expenses: [],
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    per_page: 10,
    last_page: 1,
    total: 0,
  },
  search: '',

  fetchExpenses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(apiRoutes.consultant.expenses.list, {
        params: {
          page: get().pagination.current_page,
          per_page: get().pagination.per_page,
          search: get().search,
        },
      });

      const data = response.data?.data || {};
      const expenses = data.data || [];
      const meta = data;

      set({
        expenses: Array.isArray(expenses) ? expenses : [],
        pagination: {
          current_page: meta.current_page || 1,
          per_page: meta.per_page || 10,
          last_page: meta.last_page || 1,
          total: meta.total || 0,
        },
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to fetch expenses' });
    }
  },

  addExpense: async (expense) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ConsultantExpense>(apiRoutes.consultant.expenses.create, expense);
      set((state) => ({
        expenses: [...state.expenses, response.data],
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to add expense' });
      return null;
    }
  },

  updateExpense: async (id, expense) => {
    set({ loading: true, error: null });
    try {
      const updateUrl = `${apiRoutes.consultant.expenses.list}/${id}`;
      const response = await apiClient.put<ConsultantExpense>(updateUrl, expense);
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? response.data : e)),
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to update expense' });
      return null;
    }
  },

  removeExpense: async (id) => {
    set({ loading: true, error: null });
    try {
      const deleteUrl = `${apiRoutes.consultant.expenses.list}/${id}`;
      await apiClient.delete(deleteUrl);
      set((state) => ({
        expenses: state.expenses.filter((expense) => expense.id !== id),
        loading: false,
      }));
      return true;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to delete expense' });
      return false;
    }
  },

  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
    get().fetchExpenses();
  },

  setSearch: (search) => {
    set({ search });
    get().fetchExpenses();
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));