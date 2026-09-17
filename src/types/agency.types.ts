import type { MediaFile } from './api.types';

export interface Agency {
  id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  phone2: string | null;
  is_active: boolean;
  manager_id: string | null;
  manager: AgencyManager | null;
  logo_url: string | null;
  logo_media_id: number | null;
  vehicles_count?: number;
  legal_form: string | null;
  capital: string | null;
  rc: string | null;
  tax_id: string | null;
  patente: string | null;
  ice: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_address: string | null;
  bank_account: string | null;
  bank_rib: string | null;
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
  phone2?: string;
  manager_id?: string;
  legal_form?: string;
  capital?: string;
  rc?: string;
  tax_id?: string;
  patente?: string;
  ice?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_address?: string;
  bank_account?: string;
  bank_rib?: string;
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
