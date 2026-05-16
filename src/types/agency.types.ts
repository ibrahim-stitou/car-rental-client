import type { MediaFile } from './api.types';

export interface Agency {
  id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  is_active: boolean;
  manager_id: string | null;
  manager: AgencyManager | null;
  logo_url: string | null;
  vehicles_count?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AgencyManager {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface CreateAgencyInput {
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  manager_id?: string;
}

export type UpdateAgencyInput = Partial<CreateAgencyInput>;

export interface AgencyFilters {
  city?: string;
  is_active?: boolean;
  search?: string;
  sort_by?: 'name' | 'created_at';
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}
