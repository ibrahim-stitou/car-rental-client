export type SettingGroup = 'company' | 'billing' | 'notifications' | 'reservation' | 'website';

export interface SettingItem {
  key: string;
  value: string | boolean | number | null;
  type: 'string' | 'boolean' | 'integer' | 'json';
  label: string;
  description?: string;
}

export type GroupSettings = Record<string, string | boolean | number | null>;
export type AllSettings = Record<SettingGroup, GroupSettings>;

export interface CompanySettings {
  name: string;
  tagline: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  phone: string;
  phone2: string;
  email: string;
  website: string;
  logo_url: string;
  ice: string;
  rc: string;
  cnss: string;
  if: string;
  patent: string;
  bank_name: string;
  bank_account: string;
  bank_rib: string;
  bank_swift: string;
}

export interface BillingSettings {
  currency: string;
  currency_symbol: string;
  tax_rate: number;
  tax_label: string;
  payment_terms: number;
  invoice_prefix: string;
  quote_prefix: string;
  invoice_footer: string;
}

export interface NotificationSettings {
  insurance_alert_days: number;
  inspection_alert_days: number;
  vignette_alert_days: number;
  maintenance_alert_days: number;
  reservation_reminder_hours: number;
  billing_overdue_days: number;
  client_inactive_days: number;
}

export interface ReservationSettings {
  default_deposit_percent: number;
  late_return_fee_per_hour: number;
  cancellation_free_hours: number;
  min_rental_hours: number;
  max_rental_days: number;
}

export interface WebsiteSettings {
  title: string;
  subtitle: string;
  hero_description: string;
  hero_image_url: string;
  about_title: string;
  about_description: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  whatsapp_number: string;
  google_maps_embed: string;
  meta_description: string;
  meta_keywords: string;
  primary_color: string;
  booking_enabled: boolean;
  show_prices: boolean;
}
