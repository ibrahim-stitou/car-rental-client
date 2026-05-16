export interface AuditLog {
  id: string;
  log_name: string;
  description: string;
  subject_type: string;
  subject_id: string;
  causer_type: string | null;
  causer_id: string | null;
  causer: LogCauser | null;
  properties: {
    old?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
  };
  created_at: string;
}

export interface LogCauser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface LogFilters {
  per_page?: number;
  page?: number;
}
