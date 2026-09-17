export type IdType = 'cin' | 'passport' | 'residence_permit';
export type DocSide = 'recto' | 'verso';
export type ClientType = 'physical' | 'moral';

export interface Client {
  id: string;
  client_type: ClientType;
  agencies: ClientAgency[];
  first_name: string | null;
  last_name: string | null;
  full_name?: string;
  email: string | null;
  phone: string;
  company_name: string | null;
  company_type: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_ice: string | null;
  company_address: string | null;
  company_city: string | null;
  company_country: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_address: string | null;
  date_of_birth: string | null;
  birth_place: string | null;
  nationality: string | null;
  id_type: IdType | null;
  id_number: string | null;
  id_expiry_date: string | null;
  driving_license_number: string | null;
  driving_license_category: string | null;
  driving_license_expiry: string | null;
  license_issue_date: string | null;
  license_issue_place: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  notes: string | null;

  // Pièce d'identité — recto / verso
  id_document_recto: string | null;
  id_document_recto_media_id: number | null;
  id_document_verso: string | null;
  id_document_verso_media_id: number | null;

  // Permis de conduire — recto / verso
  driving_license_recto: string | null;
  driving_license_recto_media_id: number | null;
  driving_license_verso: string | null;
  driving_license_verso_media_id: number | null;

  selfie: string | null;
  selfie_media_id: number | null;
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
  client_type: ClientType;
  agency_ids: string[];
  first_name?: string | null;
  last_name?: string | null;
  email?: string;
  phone: string;
  date_of_birth?: string;
  birth_place?: string;
  nationality?: string;
  id_type?: IdType;
  id_number?: string;
  id_expiry_date?: string;
  driving_license_number?: string;
  driving_license_category?: string;
  driving_license_expiry?: string;
  license_issue_date?: string;
  license_issue_place?: string;
  company_name?: string | null;
  company_type?: string | null;
  company_phone?: string | null;
  company_email?: string | null;
  company_ice?: string | null;
  company_address?: string | null;
  company_city?: string | null;
  company_country?: string | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_address?: string | null;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
}

export type UpdateClientInput = Partial<CreateClientInput>;

export interface ClientFilters {
  agency_id?: string;
  is_blacklisted?: boolean;
  client_type?: ClientType;
  city?: string;
  search?: string;
  per_page?: number;
  page?: number;
}