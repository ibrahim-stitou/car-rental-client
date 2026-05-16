export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  severity: NotificationSeverity;
  is_read: boolean;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  by_severity: {
    info: number;
    warning: number;
    critical: number;
  };
}

export interface SendNotificationInput {
  title: string;
  body: string;
  user_ids?: string[];
  agency_id?: string;
  roles?: string[];
  severity: NotificationSeverity;
  action_url?: string;
}

export interface NotificationFilters {
  per_page?: number;
  type?: string;
  severity?: NotificationSeverity;
}
