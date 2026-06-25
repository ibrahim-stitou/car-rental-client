export type BillingDocumentType = 'BC' | 'BR' | 'BL' | 'DV' | 'FA' | 'AV';
export type BillingStatus = 'draft' | 'pending' | 'approved' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'online';

export const BILLING_TYPE_LABELS: Record<BillingDocumentType, string> = {
  BC: 'Bon de Commande',
  BR: 'Bon de Réception',
  BL: 'Bon de Livraison',
  DV: 'Devis',
  FA: 'Facture',
  AV: 'Avoir',
};

export interface BillingDocumentItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
}

export interface BillingDocument {
  id: string;
  reference: string;
  document_number: string;
  type: BillingDocumentType;
  status: BillingStatus;
  agency_id: string;
  reservation_id: string | null;
  reservation?: { id: string; reservation_number: string } | null;
  client_id: string | null;
  client_name: string;
  client_address: string | null;
  client_phone: string | null;
  client_email: string | null;
  client_ice: string | null;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_percentage: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  approved_at: string | null;
  approved_by: string | null;
  unapprove_reason: string | null;
  notes: string | null;
  items?: BillingDocumentItem[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BillingItemInput {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
}

export interface CreateBillingInput {
  type: BillingDocumentType;
  agency_id: string;
  reservation_id?: string;
  client_id?: string;
  client_name: string;
  client_address?: string;
  client_phone?: string;
  client_email?: string;
  client_ice?: string;
  issue_date: string;
  due_date?: string;
  delivery_date?: string;
  payment_method?: PaymentMethod;
  items: BillingItemInput[];
}

export type UpdateBillingInput = Partial<CreateBillingInput>;

export interface MarkPaidInput {
  payment_method: PaymentMethod;
  payment_reference?: string;
}

export type MarkBillingPaidInput = MarkPaidInput;

export interface BillingFilters {
  type?: BillingDocumentType;
  status?: BillingStatus;
  agency_id?: string;
  reservation_id?: string;
  client_id?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface BillingHistoryEntry {
  id: number;
  event: string;
  type: 'default' | 'info' | 'success' | 'warning' | 'error';
  label: string;
  detail: string | null;
  user: { id: string; name: string } | null;
  created_at: string;
}

export interface BillingStatistics {
  total_documents: number;
  total_revenue: number;
  pending_amount: number;
  by_type: Record<BillingDocumentType, number>;
  by_status: Record<BillingStatus, number>;
}
