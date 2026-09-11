export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'out_of_service';

export type VehicleCondition =
  | 'bon_etat'
  | 'leger_dommage'
  | 'accidente'
  | 'hors_service';

export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid';

export type Transmission = 'automatic' | 'manual';

export type VehicleCategory =
  | 'sedan'
  | 'suv'
  | 'van'
  | 'truck'
  | 'convertible'
  | 'coupe'
  | 'hatchback'
  | 'minivan';

export type DocumentStatus = 'active' | 'expiring_soon' | 'expired';

export interface VehicleDocumentsStatus {
  technical_inspection: DocumentStatus;
  insurance: DocumentStatus;
  vignette: DocumentStatus;
}

export interface Vehicle {
  id: string;
  agency_id: string;
  agency: VehicleAgency;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  vin: string | null;
  color: string;
  category: VehicleCategory;
  fuel_type: FuelType;
  transmission: Transmission;
  seats: number;
  daily_rate: number;
  hourly_rate: number | null;
  monthly_rate: number | null;
  deposit_amount: number;
  mileage: number;
  average_consumption: number | null;
  status: VehicleStatus;
  condition: VehicleCondition;
  is_active: boolean;
  has_adblue: boolean;
  notes: string | null;
  description: string | null;
  photos: VehiclePhoto[];
  documents_count?: number;

  documents_status: VehicleDocumentsStatus;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  show_on_website: boolean;
  website_description: string | null;
  website_price_override: number | null;
  website_price: number;
  registration_card: string | null;
}

export interface VehicleAgency {
  id: string;
  name: string;
  city: string;
  phone?: string;
}

export interface VehiclePhoto {
  id: string;
  url: string;
  file_name: string;
}

export interface CreateVehicleInput {
  agency_id: string;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  vin?: string;
  color: string;
  category: VehicleCategory;
  fuel_type: FuelType;
  transmission: Transmission;
  seats: number;
  daily_rate: number;
  hourly_rate?: number;
  monthly_rate?: number;
  deposit_amount: number;
  mileage: number;
  average_consumption?: number;
  condition?: VehicleCondition;
  notes?: string;
  description?: string;
  has_adblue?: boolean;
  show_on_website?: boolean;
  website_description?: string;
  website_price_override?: number;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export interface VehicleFilters {
  agency_id?: string;
  status?: VehicleStatus;
  category?: VehicleCategory;
  fuel_type?: FuelType;
  transmission?: Transmission;
  is_active?: boolean;
  returning_today?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}