import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { TechnicalInspection, CreateTechnicalInspectionInput, UpdateTechnicalInspectionInput, TechnicalInspectionFilters } from '@/types/technical-inspection.types';

export const technicalInspectionService = {
  list: (filters?: TechnicalInspectionFilters) =>
    apiClient.get<PaginatedResponse<TechnicalInspection>>(apiRoutes.technicalInspections.list, { params: filters }).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<TechnicalInspection>>(apiRoutes.technicalInspections.show(id)).then((r) => r.data),
  create: (input: CreateTechnicalInspectionInput) =>
    apiClient.post<ApiResponse<TechnicalInspection>>(apiRoutes.technicalInspections.create, input).then((r) => r.data),
  update: (id: string, input: UpdateTechnicalInspectionInput) =>
    apiClient.put<ApiResponse<TechnicalInspection>>(apiRoutes.technicalInspections.update(id), input).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.technicalInspections.delete(id)).then((r) => r.data),
  restore: (id: string) =>
    apiClient.post<ApiResponse<TechnicalInspection>>(apiRoutes.technicalInspections.restore(id)).then((r) => r.data),
};
