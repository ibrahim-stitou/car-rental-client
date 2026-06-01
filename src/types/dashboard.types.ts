export interface DashboardVehicleStats {
  total: number;
  available: number;
  rented: number;
  maintenance: number;
  out_of_service: number;
}

export interface DashboardReservationStats {
  total: number;
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  cancelled: number;
  overdue: number;
  pending_action: number;
  upcoming_returns: number;
  this_month: number;
}

export interface DashboardBillingStats {
  total_invoices: number;
  total_revenue: number;
  revenue_this_month: number;
  revenue_last_month: number;
  pending_amount: number;
  draft_count: number;
  paid_count: number;
}

export interface DashboardClientStats {
  total: number;
  active: number;
  blacklisted: number;
  new_this_month: number;
}

export interface DashboardExpiringStats {
  insurances: number;
  inspections: number;
  vignettes: number;
  maintenances: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface RecentReservation {
  id: string;
  reservation_number: string;
  status: string;
  pickup_date: string;
  return_date: string;
  total_amount: number;
  vehicle: { id: string; brand: string; model: string; registration_number: string } | null;
  client: { id: string; first_name: string; last_name: string } | null;
}

export interface DashboardStatistics {
  vehicles: DashboardVehicleStats;
  reservations: DashboardReservationStats;
  billing: DashboardBillingStats;
  clients: DashboardClientStats;
  expiring: DashboardExpiringStats;
  monthly_revenue: MonthlyRevenue[];
  recent_reservations: RecentReservation[];
}
