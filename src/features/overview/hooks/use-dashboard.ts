import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  statistics: (agencyId?: string) => [...dashboardKeys.all, 'statistics', agencyId] as const,
};

export function useDashboardStatistics(agencyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.statistics(agencyId),
    queryFn: () => dashboardService.statistics(agencyId),
    staleTime: 2 * 60 * 1000,
  });
}
