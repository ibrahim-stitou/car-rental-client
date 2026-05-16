export type InspectionResult = 'passed' | 'failed' | 'pending';

export interface TechnicalInspection {
  id: string;
  vehicle_id: string;
  vehicle: InspectionVehicle;
  inspection_date: string;
  expiry_date: string;
  result: InspectionResult;
  inspection_center: string | null;
  inspector_name: string | null;
  observations: string | null;
  cost: number | null;
  next_inspection_date: string | null;
  is_expired: boolean;
  days_until_expiry: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InspectionVehicle {
  id: string;
  brand: string;
  model: string;
  registration_number: string;
}

export interface CreateTechnicalInspectionInput {
  vehicle_id: string;
  inspection_date: string;
  expiry_date: string;
  result: InspectionResult;
  inspection_center?: string;
  inspector_name?: string;
  observations?: string;
  cost?: number;
  next_inspection_date?: string;
}

export type UpdateTechnicalInspectionInput = Partial<CreateTechnicalInspectionInput>;

export interface TechnicalInspectionFilters {
  vehicle_id?: string;
  result?: InspectionResult;
  per_page?: number;
  page?: number;
}
