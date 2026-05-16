'use client';
import { create } from 'zustand';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

export interface Invoice {
  id: number;
  reference: string;
  client_id: number;
  objet: string;
  date: string;
  date_echenace: string;
  total_ht: string;
  total_ttc: string;
  status: 'draft' | 'validated' | 'paid' | 'cancelled';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  client: {
    id: number;
    name: string;
    capital: string;
    idnumber: string;
    address: string;
    phone: string;
    mail: string;
    country_id: number;
    code_postal: string;
    city: string;
    iban: string;
    bic: string;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
  };
}

interface Pagination {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

interface InvoiceStore {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  search: string;
  fetchInvoices: () => Promise<void>;
  addInvoice: (invoice: Partial<Invoice>) => Promise<Invoice | null>;
  updateInvoice: (id: number, invoice: Partial<Invoice>) => Promise<Invoice | null>;
  removeInvoice: (id: number) => Promise<boolean>;
  setPagination: (pagination: Partial<Pagination>) => void;
  setSearch: (search: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: [],
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    per_page: 10,
    last_page: 1,
    total: 0,
  },
  search: '',

  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(apiRoutes.admin.invoices.list, {
        params: {
          page: get().pagination.current_page,
          per_page: get().pagination.per_page,
          search: get().search,
        },
      });
      set({
        invoices: response.data.data.data,
        pagination: {
          current_page: response.data.data.current_page,
          per_page: response.data.data.per_page,
          last_page: response.data.data.last_page,
          total: response.data.data.total,
        },
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to fetch invoices' });
    }
  },

  addInvoice: async (invoice) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Invoice>(apiRoutes.admin.invoices.create, invoice);
      set((state) => ({
        invoices: [...state.invoices, response.data],
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to add invoice' });
      return null;
    }
  },

  updateInvoice: async (id, invoice) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<Invoice>(apiRoutes.admin.invoices.update(id), invoice);
      set((state) => ({
        invoices: state.invoices.map((i) => (i.id === id ? response.data : i)),
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to update invoice' });
      return null;
    }
  },

  removeInvoice: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(apiRoutes.admin.invoices.delete(id));
      set((state) => ({
        invoices: state.invoices.filter((i) => i.id !== id),
        loading: false,
      }));
      return true;
    } catch (error: any) {
      set({ loading: false, error: error.response?.data?.message || 'Failed to delete invoice' });
      return false;
    }
  },

  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
    get().fetchInvoices();
  },

  setSearch: (search) => {
    set({ search });
    get().fetchInvoices();
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));