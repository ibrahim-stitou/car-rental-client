import type { MediaItem } from './claim.types';

export type ReservationStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'no_show';
export type CreditReservation = {
  id: string;
  reservation_number: string;
  total_amount: number;
  paid_amount: number;
  credit_amount: number;
  status: ReservationStatus;
  client?: { id: string; first_name: string; last_name: string; full_name?: string };
  vehicle?: { id: string; brand: string; model: string; registration_number: string };
  agency?: { id: string; name: string };
};
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'online';
export type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
export type ContractStatus = 'not_generated' | 'valid' | 'invalidated';
export type RentalUnit = 'day' | 'hour' | 'month';

export interface ReservationContractEvent {
  id: string;
  event_type: 'generated' | 'regenerated' | 'invalidated';
  reason: string | null;
  actor: { id: string; full_name: string } | null;
  created_at: string;
}

export interface ReservationContractVersion {
  id: number;
  url: string;
  file_name: string;
  created_at: string;
  is_current: boolean;
}

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
  actual_return_location: string | null;
  is_favorable: boolean | null;
  closure_comment: string | null;
  contract_generated_at: string | null;
  contract_status: ContractStatus;
  contract_events?: ReservationContractEvent[];
  contract_versions?: ReservationContractVersion[];
  is_overdue?: boolean;
  documents?: MediaItem[];
  status: ReservationStatus;
  rental_unit: RentalUnit;
  daily_rate: number;
  hourly_rate: number | null;
  monthly_rate: number | null;
  total_days: number | null;
  total_hours: number | null;
  total_months: number | null;
  /** LLD only — whole calendar months elapsed since pickup, capped at total_months. */
  months_elapsed?: number;
  /** LLD only — installments due as of today (months_elapsed + 1, capped). */
  months_due?: number;
  /** LLD only — monthly_rate x months_due; the "credit" basis, not the full contract value. */
  amount_due_so_far?: number;
  subtotal?: number;
  discount_percentage: number;
  additional_fees: number;
  deposit_amount: number;
  total_amount: number;
  paid_amount: number;
  /** LLD only — total already billed across this reservation's 'LLD'-type invoices. */
  invoiced_amount?: number;
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
  full_name: string;
  registration_number: string;
}

export interface ReservationClient {
  id: string;
  full_name: string;
  phone: string;
}

export interface CreateReservationInput {
  agency_id: string;
  vehicle_id: string;
  client_id: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  rental_unit?: RentalUnit;
  daily_rate: number;
  hourly_rate?: number;
  monthly_rate?: number;
  discount_percentage?: number;
  additional_fees?: number;
  deposit_amount: number;
  payment_method?: PaymentMethod;
  notes?: string;
  initial_paid_amount?: number;
  initial_payment_method?: PaymentMethod;
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
  actual_return_date?: string;
  actual_return_location?: string;
  is_favorable?: boolean;
  closure_comment?: string;
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
  rental_unit?: RentalUnit;
  search?: string;
  overdue?: 0 | 1;
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
