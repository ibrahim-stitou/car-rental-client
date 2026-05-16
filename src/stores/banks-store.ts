import { create } from 'zustand';
import { toast } from '@/components/ui/sonner';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';

// Interface pour Country depuis le backend
export interface Country {
  id: number;
  nom: string;
  code: string;
  indicatif_telephonique?: string;
  devise?: string;
  tva_standard?: number;
  created_at?: string;
  updated_at?: string;
}


// Interface pour les données de Bank depuis le backend
export interface Bank {
  id: number;
  name: string;
  bic: string;
  country_id: number;
  is_active: boolean;
  iban: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  country?: Country;
}

// Interface pour le store
interface BanksState {
  banks: Bank[];
  countries: Country[];
  selectedCountry: number | null;
  isLoading: boolean;
  isLoadingCountries: boolean;
  error: string | null;
  totalItems: number;

  // Actions
  setSelectedCountry: (countryId: number | null) => void;
  fetchCountries: () => Promise<Country[]>;
  fetchBanks: (countryId?: number | null, search?: string) => Promise<Bank[]>;
  toggleBankStatus: (bankId: number) => Promise<boolean>;
  addBank: (bankData: FormData) => Promise<boolean>;
  updateBank: (bankId: number, bankData: FormData) => Promise<boolean>;
  deleteBank: (bankId: number) => Promise<boolean>;
  getBankById: (bankId: number) => Promise<Bank | null>;
}

export const useBanksStore = create<BanksState>((set, get) => ({
  banks: [],
  countries: [],
  selectedCountry: null,
  isLoading: false,
  isLoadingCountries: false,
  error: null,
  totalItems: 0,

  setSelectedCountry: (countryId: number | null) => {
    set({ selectedCountry: countryId });
    // Vider les banques actuelles lors du changement de pays
    set({ banks: [] });
  },

  fetchCountries: async () => {
    set({ isLoadingCountries: true, error: null });

    try {
      const response = await apiClient.get(apiRoutes.admin.countries.list);

      if (response.status === 200) {
        const countriesData = response.data.success
          ? response.data.data
          : (Array.isArray(response.data)
            ? response.data
            : response.data.data || []);

        set({ countries: countriesData, isLoadingCountries: false });
        return countriesData;
      } else {
        throw new Error(response.data?.message || 'Failed to fetch countries');
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({
        error: errorMessage,
        isLoadingCountries: false
      });
      toast.error("Impossible de charger la liste des pays");
      return [];
    }
  },

  fetchBanks: async (countryId = null, search = '') => {
    set({ isLoading: true, error: null });

    try {
      // Fetch all banks first
      const response = await apiClient.get('/admin/banks');

      if (response.data.success) {
        let banksData = response.data.data;

        // Filter by country if specified
        if (countryId !== null) {
          banksData = banksData.filter((bank: Bank) => bank.country_id === countryId);
        }

        // Filter by search term if specified
        if (search) {
          const searchLower = search.toLowerCase();
          banksData = banksData.filter((bank: Bank) =>
            bank.name.toLowerCase().includes(searchLower) ||
            bank.bic.toLowerCase().includes(searchLower) ||
            bank.iban.toLowerCase().includes(searchLower)
          );
        }

        set({
          banks: banksData,
          isLoading: false,
          totalItems: banksData.length
        });
        return banksData;
      } else {
        throw new Error(response.data.message || 'Failed to fetch banks');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error("Impossible de charger les banques");
      return [];
    }
  },

  getBankById: async (bankId: number) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.get(`/admin/banks/${bankId}`);

      if (response.data.success) {
        const bankData = response.data.data.bank;
        set({ isLoading: false });
        return bankData;
      } else {
        throw new Error(response.data.message || 'Failed to fetch bank details');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error("Impossible de récupérer les détails de la banque");
      return null;
    }
  },

  toggleBankStatus: async (bankId: number) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.put(`/admin/banks/${bankId}/toggle-status`);

      if (response.data.success) {
        // Update bank status in the local state
        const banks = get().banks.map(bank =>
          bank.id === bankId
            ? { ...bank, is_active: !bank.is_active }
            : bank
        );

        set({ banks, isLoading: false });
        toast.success(response.data.message || "Statut de la banque modifié avec succès");
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to toggle bank status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error("Impossible de modifier le statut de la banque");
      return false;
    }
  },

  // Updated addBank method with properly formatted boolean values
  // Fonction addBank mise à jour pour gérer les erreurs de validation
  addBank: async (bankData: FormData) => {
    set({ isLoading: true, error: null });

    try {
      // Ensure is_active is properly formatted for the backend
      if (bankData.has('is_active')) {
        const isActive = bankData.get('is_active');
        bankData.delete('is_active');

        // Convert to the format expected by the backend (1/0)
        if (typeof isActive === 'string') {
          const boolValue = isActive === 'true' || isActive === '1';
          bankData.append('is_active', boolValue ? '1' : '0');
        }
      }

      const response = await apiClient.post('/admin/banks', bankData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        set({ isLoading: false });
        toast.success(response.data.message || "Banque créée avec succès");

        // Refresh the banks list
        await get().fetchBanks(get().selectedCountry);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to add bank');
      }
    } catch (error: any) {
      set({ isLoading: false });

      // Vérifier si l'erreur est une erreur de validation (status 422)
      if (error.response && error.response.status === 422) {
        // Récupérer les erreurs de validation
        const validationErrors = error.response.data.errors;

        // Afficher chaque erreur de validation avec toast
        if (validationErrors) {
          Object.entries(validationErrors).forEach(([field, messages]) => {
            const fieldMessages = Array.isArray(messages) ? messages : [messages];
            fieldMessages.forEach(message => {
              toast.error(`${field}: ${message}`);
            });
          });
        }

        // Définir l'erreur dans le state pour une utilisation éventuelle dans le composant
        set({ error: 'Validation failed' });
      } else {
        // Pour les autres types d'erreurs
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage });
        toast.error("Échec de l'ajout de la banque");
      }

      return false;
    }
  },

// Fonction updateBank mise à jour pour gérer les erreurs de validation
  updateBank: async (bankId: number, bankData: FormData) => {
    set({ isLoading: true, error: null });

    try {
      // Add PUT method indication for RESTful update
      bankData.append('_method', 'PUT');

      // Ensure is_active is properly formatted for the backend
      if (bankData.has('is_active')) {
        const isActive = bankData.get('is_active');
        bankData.delete('is_active');

        // Convert to the format expected by the backend (1/0)
        if (typeof isActive === 'string') {
          const boolValue = isActive === 'true' || isActive === '1';
          bankData.append('is_active', boolValue ? '1' : '0');
        }
      }

      const response = await apiClient.post(`/admin/banks/${bankId}`, bankData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        set({ isLoading: false });
        toast.success(response.data.message || "Banque mise à jour avec succès");

        // Refresh the banks list
        await get().fetchBanks(get().selectedCountry);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update bank');
      }
    } catch (error: any) {
      set({ isLoading: false });

      // Vérifier si l'erreur est une erreur de validation (status 422)
      if (error.response && error.response.status === 422) {
        // Récupérer les erreurs de validation
        const validationErrors = error.response.data.errors;

        // Afficher chaque erreur de validation avec toast
        if (validationErrors) {
          Object.entries(validationErrors).forEach(([field, messages]) => {
            const fieldMessages = Array.isArray(messages) ? messages : [messages];
            fieldMessages.forEach(message => {
              toast.error(`${field}: ${message}`);
            });
          });
        }

        // Définir l'erreur dans le state pour une utilisation éventuelle dans le composant
        set({ error: 'Validation failed' });
      } else {
        // Pour les autres types d'erreurs
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage });
        toast.error("Échec de la mise à jour de la banque");
      }

      return false;
    }
  },
  deleteBank: async (bankId: number) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.delete(`/admin/banks/${bankId}`);

      if (response.data.success) {
        // Remove the bank from the local state
        const banks = get().banks.filter(bank => bank.id !== bankId);

        set({
          banks,
          isLoading: false,
          totalItems: banks.length
        });

        toast.success(response.data.message || "Banque supprimée avec succès");
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete bank');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error("Échec de la suppression de la banque");
      return false;
    }
  }
}));