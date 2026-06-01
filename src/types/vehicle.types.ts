export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'out_of_service';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid';
export type Transmission = 'automatic' | 'manual';
export type VehicleCategory = 'sedan' | 'suv' | 'van' | 'truck' | 'convertible' | 'coupe' | 'hatchback' | 'minivan';

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
  deposit_amount: number;
  mileage: number;
  status: VehicleStatus;
  is_active: boolean;
  notes: string | null;
  photos: VehiclePhoto[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  show_on_website: boolean;
  website_description: string | null;
  website_price_override: number | null;
  website_price: number;
}

export interface VehicleAgency {
  id: string;
  name: string;
  city: string;
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
  deposit_amount: number;
  mileage: number;
  notes?: string;
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
  search?: string;
  per_page?: number;
  page?: number;
}
