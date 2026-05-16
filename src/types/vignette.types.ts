export type VignettePaymentMethod = 'cash' | 'bank_transfer' | 'online';

export interface Vignette {
  id: string;
  vehicle_id: string;
  vehicle: VignetteVehicle;
  year: number;
  issue_date: string;
  expiry_date: string;
  amount: number;
  is_paid: boolean;
  payment_method: VignettePaymentMethod | null;
  payment_reference: string | null;
  payment_date: string | null;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface VignetteVehicle {
  id: string;
  brand: string;
  model: string;
  registration_number: string;
}

export interface CreateVignetteInput {
  vehicle_id: string;
  year: number;
  issue_date: string;
  expiry_date: string;
  amount: number;
  payment_method?: VignettePaymentMethod;
  payment_reference?: string;
}

export type UpdateVignetteInput = Partial<CreateVignetteInput>;

export interface MarkVignettePaidInput {
  payment_method: VignettePaymentMethod;
  payment_reference?: string;
}

export interface VignetteFilters {
  vehicle_id?: string;
  is_paid?: boolean;
  year?: number;
  per_page?: number;
  page?: number;
}
