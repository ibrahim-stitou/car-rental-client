export type ClaimStatus = 'open' | 'under_review' | 'insurance_claimed' | 'settled' | 'closed' | 'rejected';
export type AccidentType = 'collision' | 'theft' | 'vandalism' | 'natural_disaster' | 'fire' | 'glass_damage' | 'parking' | 'other';

export interface Claim {
  id: string;
  claim_number: string;
  vehicle_id: string;
  reservation_id: string | null;
  client_id: string | null;
  maintenance_id: string | null;
  created_by: string;

  claim_date: string;
  title: string;
  description: string | null;
  agent_notes: string | null;
  accident_type: AccidentType;
  is_client_responsible: boolean;
  responsible_notes: string | null;
  status: ClaimStatus;

  total_damage_amount: number;
  insurance_amount_recovered: number;
  client_paid_amount: number;
  company_expense_amount: number;
  net_company_loss: number;

  insurance_reference: string | null;
  insurance_claim_date: string | null;
  settlement_date: string | null;

  vehicle?: { id: string; brand: string; model: string; registration_number: string };
  client?: { id: string; full_name: string; phone: string } | null;
  reservation?: { id: string; reservation_number: string } | null;
  maintenance?: { id: string; title: string; type: string } | null;
  creator?: { id: string; full_name: string };

  photos: MediaItem[];
  documents: MediaItem[];
  insurance_documents: MediaItem[];

  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: number;
  url: string;
  file_name: string;
  mime_type: string;
  size: number;
  collection_name: string;
}

export interface CreateClaimInput {
  vehicle_id: string;
  reservation_id?: string;
  client_id?: string;
  maintenance_id?: string;
  claim_date: string;
  title: string;
  description?: string;
  agent_notes?: string;
  accident_type: AccidentType;
  is_client_responsible?: boolean;
  responsible_notes?: string;
  status?: ClaimStatus;
  total_damage_amount?: number;
  insurance_amount_recovered?: number;
  client_paid_amount?: number;
  company_expense_amount?: number;
  insurance_reference?: string;
  insurance_claim_date?: string;
  settlement_date?: string;
}

export type UpdateClaimInput = Partial<CreateClaimInput>;

export interface ClaimFilters {
  vehicle_id?: string;
  client_id?: string;
  status?: ClaimStatus;
  accident_type?: AccidentType;
  search?: string;
  per_page?: number;
  page?: number;
}
