import { create } from 'zustand';
import apiClient from 'src/lib/api';
import { apiRoutes } from 'src/config/apiRoutes';
import { stringify } from 'uuid/index';

interface Consultant {
  id: number;
  nom: string;
  prenom: string;
  full_name: string;
  profile_image_url: string;
  email: string;
}
interface Media{
  id: number;
  original_url:string;
  mime_type: string;
  name: string;
  file_name: string;
  size: number;
  type: string;
}
export interface Contract {
  media?: Array<{
    id: number;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    original_url: string;
    preview_url: string;
    created_at: string;
    collection_name: string;
  }>;
  id: number;
  consultant_id: number;
  contract:{
    consultant_id: number;
    reference: string;
    cheque_repas:string;
    start_at: string;
    end_at: string | null;
    status: string;
    date_resiliation: string | null;
    motif_resiliation: string | null;
    contract_type: string;
    fees_amount: string;
    management_fees: string;
    assurance: string;
    tresieme_mois:string ;
    media: Media[];
    notes: string | null;
    contract_document_path: string | null;
  };
  assurance:number;
  cheque_repas:number;
  reference: string;
  tresieme_mois: string;
  start_at: string;
  end_at: string | null;
  status: string;
  date_resiliation: string | null;
  motif_resiliation: string | null;
  contract_type: string;
  fees_amount: string;
  management_fees: string;
  fess_type: string;
  statut: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  consultant: Consultant;
}

interface ContractsResponse {
  success: boolean;
  data: {
    data: Contract[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

interface ContractStore {
  contracts: Contract[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
  };
  fetchContracts: (page?: number) => Promise<void>;
  getContract: (id: number | string) => Promise<Contract | null>;
  createContract: (data: Partial<Contract>) => Promise<Contract | null>;
  updateContract: (id: number | string, data: Partial<Contract>) => Promise<Contract | null>;
  deleteContract: (id: number | string) => Promise<boolean>;
}

export const useContractStore = create<ContractStore>((set, get) => ({
  contracts: [],
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  },
  
  fetchContracts: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      // Fix the typo in the API route (List -> list)
      const response = await apiClient.get(`${apiRoutes.admin.contracts.list}?page=${page}`);
      const data = response.data as ContractsResponse;
      
      set({
        contracts: data.data.data,
        pagination: {
          currentPage: data.data.current_page,
          lastPage: data.data.last_page,
          total: data.data.total,
          perPage: data.data.per_page,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      set({ error: 'Failed to fetch contracts', isLoading: false });
    }
  },
  
  getContract: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Fix the typo in the API route (add the id parameter)
      const response = await apiClient.get(apiRoutes.admin.contracts.detail(id));
      set({ isLoading: false });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get contract ${id}:`, error);
      set({ error: `Failed to get contract ${id}`, isLoading: false });
      return null;
    }
  },
  
  createContract: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(apiRoutes.admin.contracts.create, data);
      await get().fetchContracts();
      set({ isLoading: false });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create contract:', error);
      set({ error: 'Failed to create contract', isLoading: false });
      return null;
    }
  },
  
  updateContract: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(apiRoutes.admin.contracts.update(id), data);
      // Refresh the contracts list after update
      await get().fetchContracts();
      set({ isLoading: false });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update contract ${id}:`, error);
      set({ error: `Failed to update contract ${id}`, isLoading: false });
      return null;
    }
  },
  
  deleteContract: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(apiRoutes.admin.contracts.delete(id));
      // Refresh the contracts list after deletion
      await get().fetchContracts();
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error(`Failed to delete contract ${id}:`, error);
      set({ error: `Failed to delete contract ${id}`, isLoading: false });
      return false;
    }
  },
}));