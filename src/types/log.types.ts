export type AuditEvent = 'created' | 'updated' | 'deleted' | 'restored';

export interface AuditLog {
  id: number;
  user_type: string | null;
  user_id: string | null;
  event: AuditEvent | string;
  auditable_type: string;
  auditable_id: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
  user: AuditUser | null;
}

export interface AuditUser {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
}

export interface LogFilters {
  per_page?: number;
  page?: number;
  auditable_type?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

export const AUDIT_RESOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'agency', label: 'Agence' },
  { value: 'vehicle', label: 'Véhicule' },
  { value: 'client', label: 'Client' },
  { value: 'reservation', label: 'Réservation' },
  { value: 'reservation-payment', label: 'Paiement réservation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'insurance', label: 'Assurance' },
  { value: 'vignette', label: 'Vignette' },
  { value: 'technical-inspection', label: 'Visite technique' },
  { value: 'claim', label: 'Sinistre' },
  { value: 'expense', label: 'Dépense' },
  { value: 'billing-document', label: 'Facturation' },
  { value: 'parameter', label: 'Paramètre' },
  { value: 'user', label: 'Utilisateur' },
];

export const AUDIT_EVENT_LABELS: Record<string, string> = {
  created: 'Création',
  updated: 'Modification',
  deleted: 'Suppression',
  restored: 'Restauration',
};
