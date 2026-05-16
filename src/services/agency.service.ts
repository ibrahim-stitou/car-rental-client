import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Agency, CreateAgencyInput, UpdateAgencyInput, AgencyFilters } from '@/types/agency.types';

export const agencyService = {
  list: (filters?: AgencyFilters) =>
    apiClient
      .get<PaginatedResponse<Agency>>(apiRoutes.agencies.list, { params: filters })
      .then((r) => r.data),

  show: (id: string) =>
    apiClient
      .get<ApiResponse<Agency>>(apiRoutes.agencies.show(id))
      .then((r) => r.data),

  create: (input: CreateAgencyInput) =>
    apiClient
      .post<ApiResponse<Agency>>(apiRoutes.agencies.create, input)
      .then((r) => r.data),

  update: (id: string, input: UpdateAgencyInput) =>
    apiClient
      .put<ApiResponse<Agency>>(apiRoutes.agencies.update(id), input)
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.agencies.delete(id)).then((r) => r.data),

  restore: (id: string) =>
    apiClient
      .post<ApiResponse<Agency>>(apiRoutes.agencies.restore(id))
      .then((r) => r.data),
};
