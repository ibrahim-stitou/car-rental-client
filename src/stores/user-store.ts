'use client';

import { create } from 'zustand';
import apiClient from '@/lib/api';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: {
    id: number;
    name: string;
    code: string;
  };
  // Add other user properties as needed
  full_name: string;
  role_id:number,
  sexe_complet: string | null;
  telephone: string | null;
  // ...other properties
}

interface Pagination {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

interface UserStore {
  users: User[];
  loading: boolean;
  error: string | null;
  search: string;
  pagination: Pagination;

  setSearch: (search: string) => void;
  setPagination: (pagination: Partial<Pagination>) => void;
  fetchUsers: () => Promise<void>;
  removeUser: (id: number) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
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

  fetchUsers: async () => {
    set({ loading: true, error: null });

    try {
      const { current_page, per_page } = get().pagination;
      const search = get().search;

      const response = await apiClient.get('/admin/users', {
        params: {
          page: current_page,
          per_page,
          search: search.length > 0 ? search : undefined,
        },
      });

      // Handle the API response structure correctly
      if (response.data?.success && response.data?.data) {
        const { data, current_page, last_page, total, per_page } = response.data.data;

        set({
          users: data || [],
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
          error: 'Format de réponse API invalide',
          loading: false,
        });
      }
    } catch (error) {
      set({
        error: 'Erreur lors du chargement des utilisateurs',
        loading: false,
      });
    }
  },

  removeUser: (id) => set({
    users: get().users.filter(user => user.id !== id),
  }),

  setError: (error) => set({ error }),
}));