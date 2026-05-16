'use client';

import { create } from 'zustand';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

interface Role {
  code: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role?: Role;
  // Ajoutez d'autres champs selon votre API
}

interface MeStore {
  user: User | null;
  loading: boolean;
  error: Error | null;
  fetchMe: () => Promise<void>;
  clear: () => void;
}

export const useMeStore = create<MeStore>((set) => ({
  user: null,
  loading: false,
  error: null,

  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(apiRoutes.auth.me);
      set({ user: response.data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error('An unknown error occurred'), loading: false });
    }
  },

  clear: () => set({ user: null, error: null }),
}));