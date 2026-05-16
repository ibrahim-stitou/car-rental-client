'use client';

import { create } from 'zustand';
import apiClient from '@/lib/api';

export interface Client {
  id: number;
  name: string;
  capital: number | null;
  idnumber: string;
  address: string;
  phone: string;
  mail: string;
  country_id: number;
  code_postal: string;
  city: string;
  iban: string;
  bic: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Pagination {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

interface ClientStore {
  clients: Client[];
  loading: boolean;
  error: string | null;
  search: string;
  pagination: Pagination;

  setSearch: (search: string) => void;
  setPagination: (pagination: Partial<Pagination>) => void;
  fetchClients: () => Promise<void>;
  addClient: (client: Partial<Client>) => Promise<void>;
  updateClient: (id: number, client: Partial<Client>) => Promise<void>;
  removeClient: (id: number) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  loading: false,
  error: null,
  search: '',
  pagination: {
    current_page: 1,
    per_page: 10,
    last_page: 1,
    total: 0,
  },

  setSearch: (search) => set({ search }),

  setPagination: (paginationUpdate) => set({
    pagination: { ...get().pagination, ...paginationUpdate },
  }),

  fetchClients: async () => {
    set({ loading: true, error: null });

    try {
      const { current_page, per_page } = get().pagination;
      const search = get().search;

      const response = await apiClient.get('/admin/clients', {
        params: {
          page: current_page,
          per_page,
          search: search.length > 0 ? search : undefined,
        },
      });

      if (response.data?.success && response.data?.data) {
        const { data, current_page, last_page, total, per_page } = response.data.data;

        set({
          clients: data || [],
          pagination: {
            current_page,
            per_page,
            last_page,
            total,
          },
          loading: false,
        });
      } else {
        set({
          error: 'Invalid API response format',
          loading: false,
        });
      }
    } catch (error) {
      set({
        error: 'Error fetching clients',
        loading: false,
      });
    }
  },

  addClient: async (client) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.post('/admin/clients', client);

      if (response.data?.success) {
        get().fetchClients(); // Refresh the client list
      } else {
        set({ error: 'Failed to add client' });
      }
    } catch (error) {
      set({ error: 'Error adding client' });
    } finally {
      set({ loading: false });
    }
  },

  updateClient: async (id, client) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.put(`/admin/clients/${id}`, client);

      if (response.data?.success) {
        get().fetchClients(); // Refresh the client list
      } else {
        set({ error: 'Failed to update client' });
      }
    } catch (error) {
      set({ error: 'Error updating client' });
    } finally {
      set({ loading: false });
    }
  },

  removeClient: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.delete(`/admin/clients/${id}`);

      if (response.data?.success) {
        set({
          clients: get().clients.filter((client) => client.id !== id),
        });
      } else {
        set({ error: 'Failed to delete client' });
      }
    } catch (error) {
      set({ error: 'Error deleting client' });
    } finally {
      set({ loading: false });
    }
  },

  setError: (error) => set({ error }),
}));