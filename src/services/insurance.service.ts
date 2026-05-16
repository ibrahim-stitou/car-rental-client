import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Insurance, CreateInsuranceInput, UpdateInsuranceInput, InsuranceFilters } from '@/types/insurance.types';

export const insuranceService = {
  list: (filters?: InsuranceFilters) =>
    apiClient.get<PaginatedResponse<Insurance>>(apiRoutes.insurances.list, { params: filters }).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<Insurance>>(apiRoutes.insurances.show(id)).then((r) => r.data),
  create: (input: CreateInsuranceInput) =>
    apiClient.post<ApiResponse<Insurance>>(apiRoutes.insurances.create, input).then((r) => r.data),
  update: (id: string, input: UpdateInsuranceInput) =>
    apiClient.put<ApiResponse<Insurance>>(apiRoutes.insurances.update(id), input).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.insurances.delete(id)).then((r) => r.data),
  restore: (id: string) =>
    apiClient.post<ApiResponse<Insurance>>(apiRoutes.insurances.restore(id)).then((r) => r.data),
};
