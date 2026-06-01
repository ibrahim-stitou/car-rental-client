import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse } from '@/types/api.types';
import type { DashboardStatistics } from '@/types/dashboard.types';

export const dashboardService = {
  statistics: (agencyId?: string) =>
    apiClient
      .get<ApiResponse<DashboardStatistics>>(apiRoutes.dashboard.statistics, {
        params: agencyId ? { agency_id: agencyId } : {},
      })
      .then((r) => r.data),
};
