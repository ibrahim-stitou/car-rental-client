import type { PaymentMethod } from './reservation.types';

export interface ReservationPayment {
  id: string;
  reservation_id: string;
  billing_document_id: string | null;
  recorded_by: string | null;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference: string | null;
  notes: string | null;
  recorder?: { id: string; first_name: string; last_name: string } | null;
  billing_document?: { id: string; document_number: string; type: string; total_amount: number; status: string } | null;
  created_at: string;
}

export interface PaymentSummary {
  payments: ReservationPayment[];
  total_amount: number;
  total_paid: number;
  balance: number;
  is_fully_paid: boolean;
}

export interface CreatePaymentInput {
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference?: string;
  notes?: string;
  billing_document_id?: string;
}
