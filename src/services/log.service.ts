import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { AuditLog, LogFilters } from '@/types/log.types';

export const logService = {
  list: (filters?: LogFilters) =>
    apiClient.get<PaginatedResponse<AuditLog>>(apiRoutes.logs.list, { params: filters }).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<AuditLog>>(apiRoutes.logs.show(id)).then((r) => r.data),
};
