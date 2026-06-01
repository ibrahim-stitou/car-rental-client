export type WebReservationStatus = 'pending' | 'approved' | 'rejected' | 'converted';

export interface WebReservationVehicle {
  id: string;
  full_name: string;
  category: string;
  photo: string;
}

export interface WebReservation {
  id: string;
  reference: string;
  vehicle: WebReservationVehicle | null;
  vehicle_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string | null;
  days: number;
  message: string | null;
  status: WebReservationStatus;
  rejection_reason: string | null;
  reservation_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface WebsiteStats {
  total_requests: number;
  pending: number;
  approved: number;
  rejected: number;
  converted: number;
  vehicles_on_site: number;
  today_requests: number;
}

export interface WebsiteVehicleUpdate {
  show_on_website?: boolean;
  website_description?: string | null;
  website_price_override?: number | null;
}

export interface SubmitWebReservation {
  vehicle_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  pickup_date: string;
  return_date: string;
  pickup_location?: string;
  message?: string;
}
