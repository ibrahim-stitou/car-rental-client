import type { UserRole } from './auth.types';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  roles: UserRole[];
  agencies: UserAgency[];
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserAgency {
  id: string;
  name: string;
  city?: string;
  stamp_url?: string | null;
  signature_url?: string | null;
}

export interface CreateUserInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  agency_ids?: string[];
  role: UserRole;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  agency_ids?: string[];
}

export interface UserFilters {
  agency_id?: string;
  is_active?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}
