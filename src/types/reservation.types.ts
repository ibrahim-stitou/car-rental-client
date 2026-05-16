export type ReservationStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'online';
export type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';

export interface Reservation {
  id: string;
  reference: string;
  agency_id: string;
  agency: ReservationAgency;
  vehicle_id: string;
  vehicle: ReservationVehicle;
  client_id: string;
  client: ReservationClient;
  pickup_date: string;
  return_date: string;
  actual_return_date: string | null;
  pickup_location: string;
  return_location: string;
  status: ReservationStatus;
  daily_rate: number;
  discount_percentage: number;
  additional_fees: number;
  deposit_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  initial_mileage: number | null;
  final_mileage: number | null;
  fuel_level_pickup: FuelLevel | null;
  fuel_level_return: FuelLevel | null;
  notes: string | null;
  cancellation_reason: string | null;
  days_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ReservationAgency {
  id: string;
  name: string;
  city: string;
}

export interface ReservationVehicle {
  id: string;
  brand: string;
  model: string;
  registration_number: string;
  category: string;
}

export interface ReservationClient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
}

export interface CreateReservationInput {
  agency_id: string;
  vehicle_id: string;
  client_id: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  daily_rate: number;
  discount_percentage?: number;
  additional_fees?: number;
  deposit_amount: number;
  payment_method?: PaymentMethod;
  notes?: string;
}

export type UpdateReservationInput = Partial<CreateReservationInput>;

export interface ActivateReservationInput {
  initial_mileage: number;
  fuel_level_pickup: FuelLevel;
}

export interface CompleteReservationInput {
  final_mileage: number;
  fuel_level_return: FuelLevel;
  additional_fees?: number;
}

export interface CancelReservationInput {
  reason: string;
}

export interface ReservationFilters {
  agency_id?: string;
  vehicle_id?: string;
  client_id?: string;
  status?: ReservationStatus;
  payment_status?: PaymentStatus;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface CalendarReservation {
  id: string;
  reference: string;
  vehicle_id: string;
  client_name: string;
  pickup_date: string;
  return_date: string;
  status: ReservationStatus;
}

export interface ReservationStatistics {
  total: number;
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  cancelled: number;
  revenue_this_month: number;
  revenue_total: number;
}
