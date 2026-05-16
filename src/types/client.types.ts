export type IdType = 'CIN' | 'Passport' | 'Residence Permit';

export interface Client {
  id: string;
  agency_id: string;
  agency: ClientAgency;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  date_of_birth: string | null;
  nationality: string | null;
  id_type: IdType | null;
  id_number: string | null;
  id_expiry_date: string | null;
  driving_license_number: string | null;
  driving_license_category: string | null;
  driving_license_expiry: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  notes: string | null;
  reservations_count?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ClientAgency {
  id: string;
  name: string;
  city: string;
}

export interface CreateClientInput {
  agency_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  date_of_birth?: string;
  nationality?: string;
  id_type?: IdType;
  id_number?: string;
  id_expiry_date?: string;
  driving_license_number?: string;
  driving_license_category?: string;
  driving_license_expiry?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
}

export type UpdateClientInput = Partial<CreateClientInput>;

export interface ClientFilters {
  agency_id?: string;
  is_blacklisted?: boolean;
  city?: string;
  search?: string;
  per_page?: number;
  page?: number;
}
