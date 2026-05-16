'use client';
import { create } from 'zustand';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

export interface Mission {
    id: number;
    title: string;       
    description: string;
    client_id: number;
    date_debut: string;
    user_id: number;
    date_fin: string;
    status: 'en_attente' | 'en_cours' | 'termine' | 'annule';
    created_at: string;
    updated_at: string;
    tjm: number;
    tjm_type: 'forfait'|'journalier';
    adresse_prin: string;
    country_id: number;
}


interface Pagination {
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
}

interface MissionStore {
    missions: Mission[];
    loading: boolean;
    error: string | null;
    search: string;
    pagination: Pagination;

    setSearch: (search: string) => void;
    setPagination: (pagination: Partial<Pagination>) => void;
    fetchMissions: () => Promise<void>;
    addMission: (mission: Partial<Mission>) => Promise<Mission | null>;
    updateMission: (id: number, mission: Partial<Mission>) => Promise<Mission | null>;
    removeMission: (id: number) => Promise<boolean>;
    setError: (error: string | null) => void;
    clearError: () => void;
}

export const useMissionStore = create<MissionStore>((set, get) => ({
    missions: [],
    loading: false,
    error: null,
    search: '',
    pagination: {
        current_page: 1,
        per_page: 10,
        last_page: 1,
        total: 0,
    },

    setSearch: (search) => {
        set({ search });
        // Reset to page 1 when search changes
        get().setPagination({ current_page: 1 });
        get().fetchMissions();
    },

    setPagination: (pagination) => {
        set((state) => ({
            pagination: { ...state.pagination, ...pagination },
        }));
        // Fetch missions after pagination changes
        if (pagination.current_page || pagination.per_page) {
            get().fetchMissions();
        }
    },

    setError: (error) => set({ error }),
    
    clearError: () => set({ error: null }),

    fetchMissions: async () => {
        set({ loading: true, error: null });
        try {
            // Add console logging to help debug
            console.log('Fetching missions with params:', {
                page: get().pagination.current_page,
                per_page: get().pagination.per_page,
                search: get().search || undefined
            });
            console.log('Using API route:', apiRoutes.admin.missions.list);
            
            const response = await apiClient.get(
                apiRoutes.admin.missions.list, {
                params: {
                    page: get().pagination.current_page,
                    per_page: get().pagination.per_page,
                    search: get().search || undefined, // Only send if not empty
                },
                // Add timeout to prevent long waiting time if API is down
                timeout: 10000
            });
            
            // Add debug log
            console.log('Missions API response:', response);
    
            // Updated to match the actual API response structure
            set({
                missions: response.data.data.data, // Access missions correctly
                pagination: {
                    current_page: response.data.data.current_page,
                    per_page: response.data.data.per_page,
                    last_page: response.data.data.last_page,
                    total: response.data.data.total
                },
                loading: false,
            });
        }  catch (error: any) {
            // Enhanced error logging
            console.error('Error fetching missions:', error);
            
            let errorMessage = 'Failed to fetch missions';
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
                errorMessage = error.response.data?.message || errorMessage;
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Error request:', error.request);
                errorMessage = 'No response received from server';
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
                errorMessage = error.message || errorMessage;
            }
            
            set({ loading: false, error: errorMessage });
        }
    },
    addMission: async (mission) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.post<Mission>(
                apiRoutes.admin.missions.create, 
                mission
            );
            set((state) => ({
                missions: [...state.missions, response.data],
                loading: false,
            }));
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to add mission';
            console.error('Error adding mission:', errorMessage);
            set({ loading: false, error: errorMessage });
            return null;
        }
    },
    
    updateMission: async (id, mission) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.put<Mission>(
                apiRoutes.admin.missions.update(id), 
                mission
            );
            set((state) => ({
                missions: state.missions.map((m) => (m.id === id ? response.data : m)),
                loading: false,
            }));
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to update mission';
            console.error('Error updating mission:', errorMessage, error);
            set({ loading: false, error: errorMessage });
            return null;
        }
    },
    
    removeMission: async (id) => {          
        set({ loading: true, error: null });
        try {
            await apiClient.delete(apiRoutes.admin.missions.delete(id));
            set((state) => ({
                missions: state.missions.filter((m) => m.id !== id),
                loading: false,
            }));
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to delete mission';
            console.error('Error deleting mission:', errorMessage);
            set({ loading: false, error: errorMessage });
            return false;
        }
    }
}));    