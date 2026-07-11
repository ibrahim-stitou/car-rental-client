export type ParameterCategory = 'insurance_type' | 'insurance_company' | 'inspection_center' | 'expense_category';

export interface Parameter {
  id: string;
  category: ParameterCategory;
  value: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateParameterInput {
  category: ParameterCategory;
  value: string;
  label: string;
  is_active?: boolean;
  sort_order?: number;
}

export type UpdateParameterInput = Partial<CreateParameterInput>;

export interface ParameterFilters {
  category?: ParameterCategory;
  is_active?: boolean;
  per_page?: number;
}
