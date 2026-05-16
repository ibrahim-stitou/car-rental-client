export type InsuranceType = 'third_party' | 'comprehensive' | 'all_risk';

export interface Insurance {
  id: string;
  vehicle_id: string;
  vehicle: InsuranceVehicle;
  insurance_company: string;
  policy_number: string;
  type: InsuranceType;
  start_date: string;
  end_date: string;
  premium_amount: number;
  deductible_amount: number;
  coverage_details: Record<string, boolean> | null;
  agent_name: string | null;
  agent_phone: string | null;
  notes: string | null;
  is_active: boolean;
  is_expired: boolean;
  days_until_expiry: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InsuranceVehicle {
  id: string;
  brand: string;
  model: string;
  registration_number: string;
}

export interface CreateInsuranceInput {
  vehicle_id: string;
  insurance_company: string;
  policy_number: string;
  type: InsuranceType;
  start_date: string;
  end_date: string;
  premium_amount: number;
  deductible_amount?: number;
  coverage_details?: Record<string, boolean>;
  agent_name?: string;
  agent_phone?: string;
  notes?: string;
}

export type UpdateInsuranceInput = Partial<CreateInsuranceInput>;

export interface InsuranceFilters {
  vehicle_id?: string;
  type?: InsuranceType;
  is_active?: boolean;
  per_page?: number;
  page?: number;
}
