// En se basant sur les logs de la base de données et la requête réseau, le problème est probablement
// dans le traitement côté backend qui commence à i=1 au lieu de i=0 dans une boucle.
// Puisque nous ne pouvons pas modifier directement le backend, nous allons contourner le problème
// en ajustant la date de début dans la requête.

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

// Données brutes DayOff du backend
export interface DayOffResponse {
  id: number;
  name: string;
  country_id: number;
  month: number;
  year: number;
  day: number;
  created_at: string;
  updated_at: string;
  is_recuring: boolean; // Note: typo dans la réponse API
  pays?: Country;
}

// Données DayOff transformées pour l'interface
export interface DayOff {
  id: number;
  countryId: number;
  dateStart: string;
  dateEnd: string;
  name: string;
  isRecurring: boolean;
}

interface DaysOffState {
  daysOff: DayOff[];
  countries: Country[];
  selectedCountry: number | null;
  isLoading: boolean;
  isLoadingCountries: boolean;
  error: string | null;
  totalItems: number;

  // Actions
  setSelectedCountry: (countryId: number) => void;
  fetchCountries: () => Promise<Country[]>;
  fetchDaysOff: (countryId: number, page?: number, limit?: number, search?: string) => Promise<DayOff[]>;
  addDayOff: (dayOff: Omit<DayOff, 'id'>) => Promise<boolean>;
  updateDayOff: (dayOff: DayOff) => Promise<boolean>;
  deleteDayOff: (id: number | string) => Promise<boolean>;
}

// Fonction pour analyser une chaîne de date en composants
const parseDateString = (dateStr: string): { year: number; month: number; day: number } => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return {
    year,
    month: month - 1, // Convertir en mois indexé à 0 pour JS Date
    day
  };
};

// Fonction pour manipuler les dates et ajuster pour les problèmes de timezone
const adjustDate = (dateStr: string, dayOffset: number = 0): string => {
  const [year, month, day] = dateStr.split('-').map(Number);

  // Créer une date sans problème de timezone
  const date = new Date(Date.UTC(year, month - 1, day + dayOffset));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

// Transformer les données du backend au format frontend
const transformDayOff = (data: DayOffResponse): DayOff => {
  // Utiliser padStart pour s'assurer d'avoir deux chiffres pour le mois et le jour
  const month = String(data.month).padStart(2, '0');
  const day = String(data.day).padStart(2, '0');

  // Créer la chaîne de date au format YYYY-MM-DD directement sans problèmes de timezone
  const dateStr = `${data.year ?? new Date().getFullYear()}-${month}-${day}`;

  // Supposer que la date de fin est la même que la date de début
  return {
    id: data.id,
    countryId: data.country_id,
    name: data.name,
    dateStart: dateStr,
    dateEnd: dateStr,
    isRecurring: data.is_recuring // Note: typo dans la réponse API
  };
};

export const useDaysOffStore = create<DaysOffState>((set, get) => ({
  daysOff: [],
  countries: [],
  selectedCountry: null,
  isLoading: false,
  isLoadingCountries: false,
  error: null,
  totalItems: 0,

  setSelectedCountry: (countryId: number) => {
    set({ selectedCountry: countryId });
    // Vider les jours fériés actuels lors du changement de pays
    set({ daysOff: [] });
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

        const { selectedCountry } = get();
        if (selectedCountry === null && countriesData.length > 0) {
          set({ selectedCountry: countriesData[0].id });
        }

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

  fetchDaysOff: async (countryId: number, page = 1, limit = 10, search = '') => {
    set({ isLoading: true, error: null });

    try {
      const params = {
        countryId: countryId.toString(),
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      };

      // Log pour debug
      console.log("Fetching days off with params:", params);

      const response = await apiClient.get(apiRoutes.admin.settings.daysOff.list, { params });

      if (response.data.success) {
        // Vérifier que les données reçues correspondent au pays sélectionné
        let daysOffData = response.data.data.data;

        // S'assurer de ne filtrer que les jours fériés du pays sélectionné
        daysOffData = daysOffData.filter((dayOff: DayOffResponse) =>
          dayOff.country_id === countryId
        );

        // Transformer les données de la réponse API à notre format frontend
        const transformedData = daysOffData.map(transformDayOff);

        console.log(`Filtered days off for country ${countryId}:`, transformedData);

        set({
          daysOff: transformedData,
          isLoading: false,
          totalItems: transformedData.length // Utiliser la longueur réelle après filtrage
        });
        return transformedData;
      } else {
        throw new Error(response.data.message || 'Failed to fetch days off');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({
        error: errorMessage,
        isLoading: false
      });
      return [];
    }
  },

  addDayOff: async (dayOff: Omit<DayOff, 'id'>) => {
    set({ isLoading: true, error: null });

    try {
      const adjustedStartDate = adjustDate(dayOff.dateStart, -1);
      const payload = {
        name: dayOff.name,
        countryId: dayOff.countryId,
        dateStart: adjustedStartDate,
        dateEnd: dayOff.dateEnd,
        isRecurring: dayOff.isRecurring
      };

      console.log("Envoi du payload ajusté:", payload);

      const response = await apiClient.post(apiRoutes.admin.settings.daysOff.create, payload);

      if (response.data.success) {
        set({ isLoading: false });
        toast.success(response.data.message || "Jour férié ajouté avec succès");

        // Actualiser les données après l'ajout
        const { selectedCountry } = get();
        if (selectedCountry) {
          await get().fetchDaysOff(selectedCountry);
        }

        return true;
      } else {
        throw new Error(response.data.message || 'Failed to add day off');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error("Échec de l'ajout du jour férié");
      return false;
    }
  },

  updateDayOff: async (dayOff: DayOff) => {
    set({ isLoading: true, error: null });

    try {
      // Vérifier si c'est un jour férié sur plusieurs jours
      const isMultiDay = dayOff.dateStart !== dayOff.dateEnd;

      let payload;

      if (isMultiDay) {
        // Pour les jours fériés sur plusieurs jours, utiliser la même approche que pour l'ajout
        const adjustedStartDate = adjustDate(dayOff.dateStart, -1);

        payload = {
          name: dayOff.name,
          countryId: dayOff.countryId,
          dateStart: adjustedStartDate,
          dateEnd: dayOff.dateEnd,
          isRecurring: dayOff.isRecurring
        };
      } else {
        // Pour les jours fériés sur un seul jour, utiliser le format jour/mois/année
        const startDate = parseDateString(dayOff.dateStart);

        payload = {
          name: dayOff.name,
          countryId: dayOff.countryId,
          day: startDate.day,
          month: startDate.month + 1, // L'API attend un mois indexé à 1
          year: dayOff.isRecurring ? null : startDate.year,
          isRecurring: dayOff.isRecurring
        };
      }

      console.log("Mise à jour avec payload:", payload);

      const response = await apiClient.put(apiRoutes.admin.settings.daysOff.update(dayOff.id), payload);

      if (response.data.success) {
        set({ isLoading: false });
        toast.success(response.data.message || "Jour férié mis à jour avec succès");

        // Actualiser les données après la mise à jour
        const { selectedCountry } = get();
        if (selectedCountry) {
          await get().fetchDaysOff(selectedCountry);
        }

        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update day off');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error("Échec de la mise à jour du jour férié");
      return false;
    }
  },

  deleteDayOff: async (id: number | string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.delete(apiRoutes.admin.settings.daysOff.delete(id));

      if (response.data.success) {
        set({ isLoading: false });
        toast.success(response.data.message || "Jour férié supprimé avec succès");

        // Actualiser les données après la suppression
        const { selectedCountry } = get();
        if (selectedCountry) {
          await get().fetchDaysOff(selectedCountry);
        }

        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete day off');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error("Échec de la suppression du jour férié");
      return false;
    }
  }
}));