import type { MediaItem } from './claim.types';

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceType =
  | 'oil_change'
  | 'tire_change'
  | 'brake_service'
  | 'engine_repair'
  | 'body_repair'
  | 'electrical'
  | 'cleaning'
  | 'other';
export type MaintenanceSubType =
  | 'oil_change'
  | 'tire_change'
  | 'brake_service'
  | 'filter_change'
  | 'battery'
  | 'timing_belt'
  | 'general_service'
  | 'other';

export interface Maintenance {
  id: string;
  vehicle_id: string;
  vehicle: MaintenanceVehicle;
  title: string | null;
  type: MaintenanceType;
  sub_type: MaintenanceSubType | null;
  description: string;
  maintenance_date: string;
  completion_date: string | null;
  mileage_at_service: number | null;
  next_service_mileage: number | null;
  next_oil_change_mileage: number | null;
  tire_position: string | null;
  next_service_date: string | null;
  cost: number;
  actual_cost: number | null;
  service_provider: string | null;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  agent_notes: string | null;
  invoices?: MediaItem[];
  photos_before?: MediaItem[];
  photos_after?: MediaItem[];
  documents?: MediaItem[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MaintenanceVehicle {
  id: string;
  brand: string;
  model: string;
  registration_number: string;
  mileage?: number;
}

export interface CreateMaintenanceInput {
  vehicle_id: string;
  title?: string;
  type: MaintenanceType;
  sub_type?: MaintenanceSubType;
  description: string;
  maintenance_date: string;
  mileage_at_service?: number;
  next_service_mileage?: number;
  next_oil_change_mileage?: number;
  tire_position?: string;
  next_service_date?: string;
  cost: number;
  actual_cost?: number;
  service_provider?: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  agent_notes?: string;
}

export type UpdateMaintenanceInput = Partial<CreateMaintenanceInput>;

export interface MaintenanceFilters {
  vehicle_id?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  type?: MaintenanceType;
  per_page?: number;
  page?: number;
}
