import { create } from 'zustand';
import apiClient from 'src/lib/api';
import { apiRoutes } from 'src/config/apiRoutes';

interface Mission {
  adresse_prin: any;
  country: any;
  mainAddress: any;
  endDate: string;
  startDate: string;
  rateType: string;
  dailyRate: string;
  id: number;
  title: string;
  client: {
    address: any;
    name: string };
  tjm: string;
  tjm_type: string;
  date_debut: string;
  date_fin: string;
  status: string;
}

interface MissionsStore {
  missions: Mission[];
  fetchMissions: () => Promise<void>;
}

export const useMissionsStore = create<MissionsStore>((set) => ({
  missions: [],
  fetchMissions: async () => {
    try {
      const response = await apiClient.get(apiRoutes.consultant.missions.list);
      set({ missions: response.data.data.data });
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    }
  },
}));