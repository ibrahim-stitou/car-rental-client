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
}

export interface DashboardBillingStats {
  total_invoices: number;
  total_revenue: number;
  pending_amount: number;
  draft_count: number;
  paid_count: number;
}

export interface DashboardClientStats {
  total: number;
  active: number;
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

export interface DashboardStatistics {
  vehicles: DashboardVehicleStats;
  reservations: DashboardReservationStats;
  billing: DashboardBillingStats;
  clients: DashboardClientStats;
  expiring: DashboardExpiringStats;
  monthly_revenue: MonthlyRevenue[];
}
