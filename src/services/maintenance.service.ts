import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Maintenance, CreateMaintenanceInput, UpdateMaintenanceInput, MaintenanceFilters, MaintenanceStatus } from '@/types/maintenance.types';

export const maintenanceService = {
  list: (filters?: MaintenanceFilters) =>
    apiClient.get<PaginatedResponse<Maintenance>>(apiRoutes.maintenances.list, { params: filters }).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<Maintenance>>(apiRoutes.maintenances.show(id)).then((r) => r.data),
  create: (input: CreateMaintenanceInput) =>
    apiClient.post<ApiResponse<Maintenance>>(apiRoutes.maintenances.create, input).then((r) => r.data),
  update: (id: string, input: UpdateMaintenanceInput) =>
    apiClient.put<ApiResponse<Maintenance>>(apiRoutes.maintenances.update(id), input).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.maintenances.delete(id)).then((r) => r.data),
  restore: (id: string) =>
    apiClient.post<ApiResponse<Maintenance>>(apiRoutes.maintenances.restore(id)).then((r) => r.data),
  updateStatus: (id: string, status: MaintenanceStatus) =>
    apiClient.patch<ApiResponse<Maintenance>>(apiRoutes.maintenances.updateStatus(id), { status }).then((r) => r.data),
};
