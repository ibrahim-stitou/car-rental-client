export type ExpenseCategory =
  | 'fuel' | 'maintenance' | 'insurance' | 'vignette' | 'inspection'
  | 'repair' | 'cleaning' | 'administrative' | 'salary' | 'rent'
  | 'utilities' | 'other';

export type ExpensePaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'online';

export interface Expense {
  id: string;
  agency_id: string | null;
  vehicle_id: string | null;
  recorded_by: string | null;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  payment_method: ExpensePaymentMethod | null;
  reference: string | null;
  notes: string | null;
  agency?: { id: string; name: string } | null;
  vehicle?: { id: string; brand: string; model: string; registration_number: string } | null;
  recorder?: { id: string; first_name: string; last_name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  agency_id?: string;
  vehicle_id?: string;
  payment_method?: ExpensePaymentMethod;
  reference?: string;
  notes?: string;
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface ExpenseFilters {
  agency_id?: string;
  vehicle_id?: string;
  category?: ExpenseCategory;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface ExpenseStatistics {
  total: number;
  thisMonth: number;
  lastMonth: number;
  byCategory: Record<string, number>;
}
