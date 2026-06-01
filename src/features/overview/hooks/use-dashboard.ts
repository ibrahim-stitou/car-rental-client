import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  statistics: (agencyId?: string) => [...dashboardKeys.all, 'statistics', agencyId] as const,
  overdue: ['dashboard', 'overdue'] as const,
  credits: ['dashboard', 'credits'] as const,
};

export function useDashboardStatistics(agencyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.statistics(agencyId),
    queryFn: () => dashboardService.statistics(agencyId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOverdueReservations() {
  return useQuery({
    queryKey: dashboardKeys.overdue,
    queryFn: () => apiClient.get(apiRoutes.reservationsExt.overdue, { params: { per_page: 20 } }).then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

export function useCreditReservations() {
  return useQuery({
    queryKey: dashboardKeys.credits,
    queryFn: () => apiClient.get(apiRoutes.reservationsExt.credits, { params: { per_page: 30 } }).then((r) => r.data),
    staleTime: 60 * 1000,
  });
}
