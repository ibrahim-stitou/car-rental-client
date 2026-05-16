export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceType =
  | 'oil_change'
  | 'tire_rotation'
  | 'brake_service'
  | 'engine_service'
  | 'transmission_service'
  | 'battery_replacement'
  | 'body_repair'
  | 'general_inspection'
  | 'other';

export interface Maintenance {
  id: string;
  vehicle_id: string;
  vehicle: MaintenanceVehicle;
  type: MaintenanceType;
  description: string;
  maintenance_date: string;
  completed_date: string | null;
  mileage_at_service: number | null;
  next_service_mileage: number | null;
  next_service_date: string | null;
  cost: number;
  service_provider: string | null;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MaintenanceVehicle {
  id: string;
  brand: string;
  model: string;
  registration_number: string;
}

export interface CreateMaintenanceInput {
  vehicle_id: string;
  type: MaintenanceType;
  description: string;
  maintenance_date: string;
  mileage_at_service?: number;
  next_service_mileage?: number;
  next_service_date?: string;
  cost: number;
  service_provider?: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  notes?: string;
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
