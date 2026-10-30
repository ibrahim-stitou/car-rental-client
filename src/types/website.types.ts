export type Locale = 'fr' | 'ar' | 'en';

/** Texte traduisible tel que renvoyé par l'API ({fr, ar, en}). */
export type Translatable = Partial<Record<Locale, string | null>>;

/* ─── Demandes de réservation ─────────────────────────────────────────────── */

export type WebRequestStatus =
  | 'new'
  | 'contacted'
  | 'awaiting_payment'
  | 'converted'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type WebRequestEventType = 'call' | 'whatsapp' | 'email' | 'note';

export type RejectionCode =
  | 'vehicle_unavailable'
  | 'incomplete_file'
  | 'client_unreachable'
  | 'client_declined'
  | 'duplicate'
  | 'other';

export interface UserRef {
  id: string;
  full_name: string;
}

export interface WebRequestExtraLine {
  code: string;
  label?: string;
  quantity?: number;
  unit_price?: number;
  pricing?: 'per_day' | 'per_rental';
  total?: number;
}

export interface WebRequestEvent {
  id: string;
  type: WebRequestEventType | string;
  outcome: string | null;
  body: string | null;
  meta: Record<string, unknown> | null;
  user: UserRef | null;
  created_at: string;
}

export interface WebRequest {
  id: string;
  reference: string;
  status: WebRequestStatus;
  is_open: boolean;
  is_late: boolean;

  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_url: string | null;
  driver_age: number | null;
  flight_number: string | null;
  locale: Locale | null;

  pickup_date: string;
  return_date: string;
  days: number;
  is_one_way: boolean;
  delivery_requested: boolean;
  delivery_address: string | null;
  message: string | null;
  extras: WebRequestExtraLine[];
  estimated_total: number | null;
  currency: string | null;

  vehicle?: {
    id: string;
    full_name: string;
    registration_number: string;
    category: string;
    website_slug: string | null;
    website_price: number;
    photo: string | null;
  } | null;
  agency?: { id: string; name: string; city: string | null } | null;
  return_agency?: { id: string; name: string; city: string | null } | null;
  pickup_point?: { id: string; name: string; type: PickupPointType } | null;
  client?: { id: string; full_name: string; phone: string } | null;
  reservation?: { id: string; reservation_number: string; status: string; total_amount: number } | null;

  assigned_to?: UserRef | null;
  handled_by?: UserRef | null;
  contacted_at: string | null;
  handled_at: string | null;
  rejection_code: RejectionCode | null;
  rejection_reason: string | null;
  payment_status: string | null;
  utm: Record<string, string> | null;
  ip_address: string | null;
  created_at: string;

  events?: WebRequestEvent[];
  conversion_defaults?: ConversionDefaults;
}

/** Valeurs de la demande reprises par POST /website/requests/{id}/convert. */
export interface ConversionDefaults {
  agency_id: string | null;
  vehicle_id: string | null;
  client_id: string | null;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  rental_unit: 'day';
  daily_rate: number | null;
  additional_fees: number;
  notes: string;
}

export interface WebRequestFilters {
  status?: WebRequestStatus | WebRequestStatus[];
  open?: boolean;
  agency_id?: string;
  vehicle_id?: string;
  assigned_to?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

export interface WebRequestStats {
  total: number;
  by_status: Record<WebRequestStatus, number>;
  open: number;
  today: number;
  late_first_contact: number;
  conversion_rate: number;
  avg_first_contact_minutes: number;
  vehicles_on_site: number;
}

export interface WebRequestAvailability {
  vehicle_id: string;
  available: boolean;
  conflict: {
    id: string;
    reservation_number: string;
    status: string;
    pickup_date: string;
    return_date: string;
    client: string | null;
  } | null;
  alternatives: {
    id: string;
    full_name: string;
    registration_number: string;
    daily_rate: number;
    transmission: string | null;
    fuel_type: string | null;
  }[];
}

export interface ClientMatch {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  id_number: string | null;
  [key: string]: unknown;
}

export interface AddWebRequestEventInput {
  type: WebRequestEventType;
  outcome?: string;
  body?: string;
}

export interface RejectWebRequestInput {
  rejection_code: RejectionCode;
  reason?: string;
  notify_client?: boolean;
}

/* ─── Catalogue ───────────────────────────────────────────────────────────── */

export interface Checklist {
  complete: boolean;
  score: number;
  missing: string[];
}

export interface WebsitePhoto {
  id: number;
  url: string;
  thumb: string;
  alt: string | null;
  is_cover: boolean;
  order: number | null;
}

export type VehicleFeature =
  | 'gps' | 'bluetooth' | 'carplay' | 'android_auto' | 'usb' | 'rear_camera' | 'parking_sensors'
  | 'cruise_control' | 'heated_seats' | 'sunroof' | 'keyless' | 'isofix' | 'abs' | 'airbags';

export type MileagePolicy = 'unlimited' | 'limited';

export interface WebsiteVehicle {
  id: string;
  full_name: string;
  registration_number: string;
  brand: string;
  model: string;
  year: number | null;
  category: string | null;
  fuel_type: string | null;
  transmission: string | null;
  seats: number | null;
  status: string;
  is_active: boolean;
  agency: { id: string; name: string; city: string | null; show_on_website: boolean } | null;

  show_on_website: boolean;
  website_published_at: string | null;
  website_slug: string | null;
  website_title: Translatable;
  website_short_description: Translatable;
  website_long_description: Translatable;
  doors: number | null;
  luggage_large: number | null;
  luggage_small: number | null;
  has_ac: boolean | null;
  features: VehicleFeature[];
  website_featured: boolean;
  website_sort_order: number | null;

  daily_rate: number;
  website_price_override: number | null;
  website_price: number;
  deposit_amount: number;
  website_deposit_amount: number | null;
  min_driver_age: number | null;
  min_license_years: number | null;
  mileage_policy: MileagePolicy | null;
  mileage_limit_per_day: number | null;

  photos: WebsitePhoto[];
  checklist: Checklist;
  public_url: string;
}

export type UpdateWebsiteVehicleInput = Partial<Pick<WebsiteVehicle,
  | 'website_slug' | 'website_title' | 'website_short_description' | 'website_long_description'
  | 'doors' | 'luggage_large' | 'luggage_small' | 'has_ac' | 'features' | 'website_featured'
  | 'website_sort_order' | 'website_price_override' | 'website_deposit_amount' | 'min_driver_age'
  | 'min_license_years' | 'mileage_policy' | 'mileage_limit_per_day'>>;

export interface WebsiteCatalogFilters {
  agency_id?: string;
  published?: boolean;
  include_inactive?: boolean;
  search?: string;
  per_page?: number;
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export interface OpeningSlot { open: string; close: string }
export type OpeningHours = Partial<Record<WeekDay, OpeningSlot[]>>;

export type PickupPointType = 'airport' | 'train_station' | 'hotel' | 'address' | 'other';

export interface PickupPoint {
  id: string;
  name: Translatable;
  type: PickupPointType;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  sort_order: number | null;
}

export interface PickupPointInput {
  name: Translatable;
  type?: PickupPointType;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
  sort_order?: number | null;
}

export interface WebsiteAgency {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;

  show_on_website: boolean;
  slug: string | null;
  website_description: Translatable;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  whatsapp: string | null;
  opening_hours: OpeningHours;
  services: string[];
  website_sort_order: number | null;
  published_vehicles_count: number | null;

  photos: WebsitePhoto[];
  pickup_points: PickupPoint[];
  checklist: Checklist;
  public_url: string;
}

export type UpdateWebsiteAgencyInput = Partial<Pick<WebsiteAgency,
  | 'slug' | 'website_description' | 'latitude' | 'longitude' | 'google_maps_url' | 'whatsapp'
  | 'opening_hours' | 'services' | 'website_sort_order'>>;

export type PhotoOwnerType = 'vehicles' | 'agencies';

/* ─── Réglages du site ────────────────────────────────────────────────────── */

export interface WebsiteContent {
  title?: Translatable | string | null;
  subtitle?: Translatable | string | null;
  hero_description?: Translatable | string | null;
  about_title?: Translatable | string | null;
  about_description?: Translatable | string | null;
  meta_description?: Translatable | string | null;
  response_time_text?: Translatable | string | null;
  delivery_fee_notice?: Translatable | string | null;
  one_way_fee_notice?: Translatable | string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_address?: string | null;
  whatsapp_number?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  meta_keywords?: string | null;
  primary_color?: string | null;
  booking_enabled?: boolean;
  show_prices?: boolean;
  hero_image_url?: string | null;
}

export interface RentalConditions {
  min_driver_age: number;
  min_license_years: number;
  default_deposit_amount: number;
  mileage_policy: MileagePolicy;
  mileage_limit_per_day: number | null;
  required_documents: Translatable;
  fuel_policy: Translatable;
  additional_terms: Translatable;
}

export type ExtraPricing = 'per_day' | 'per_rental';

export interface WebsiteExtra {
  id: string;
  code: string;
  label: Translatable;
  description: Translatable | null;
  pricing: ExtraPricing;
  price: string | number;
  max_quantity: number | null;
  is_active: boolean;
  sort_order: number | null;
}

export interface WebsiteExtraInput {
  code?: string;
  label: Translatable;
  description?: Translatable | null;
  pricing: ExtraPricing;
  price: number;
  max_quantity?: number | null;
  is_active?: boolean;
  sort_order?: number | null;
}
