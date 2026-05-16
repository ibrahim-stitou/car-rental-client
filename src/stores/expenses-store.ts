'use client';
import { create } from 'zustand';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

export interface Consultant {
  id: number;
  nom: string;
  prenom: string;
  full_name: string;
  profile_image_url: string;
  sexe_complet: string | null;
}

export interface Mission {
  id: number;
  title: string;
}

export interface Expense {
  id: number;
  consultant_id: number;
  mission_id: number;
  month: string;
  year: string;
  total_ttc: string;
  validated_at: string | null;
  commentaire: string;
  status: 'pending' | 'validated' | 'rejected';
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
  consultant: Consultant;
  mission: Mission;
}

interface Pagination {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

interface ExpenseStore {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  search: string;
  fetchExpenses: () => Promise<void>;
  removeExpense: (id: number) => Promise<boolean>;
  setPagination: (pagination: Partial<Pagination>) => void;
  setSearch: (search: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
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
      const response = await apiClient.get(apiRoutes.admin.expenses.list, {
        params: {
          page: get().pagination.current_page,
          per_page: get().pagination.per_page,
          search: get().search || undefined,
        },
      });

      set({
        expenses: response.data.data.data,
        pagination: {
          current_page: response.data.data.current_page,
          per_page: response.data.data.per_page,
          last_page: response.data.data.last_page,
          total: response.data.data.total,
        },
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch expenses';
      set({ loading: false, error: errorMessage });
    }
  },

  removeExpense: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(apiRoutes.admin.expenses.delete(id));
      set((state) => ({
        expenses: state.expenses.filter((expense) => expense.id !== id),
        loading: false,
      }));
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete expense';
      set({ loading: false, error: errorMessage });
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
    get().setPagination({ current_page: 1 });
    get().fetchExpenses();
  },

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));