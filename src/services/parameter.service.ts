import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Parameter, CreateParameterInput, UpdateParameterInput, ParameterFilters } from '@/types/parameter.types';

export const parameterService = {
  list: (filters?: ParameterFilters) =>
    apiClient.get<PaginatedResponse<Parameter>>(apiRoutes.parameters.list, { params: { per_page: 100, ...filters } }).then((r) => r.data),

  show: (id: string) =>
    apiClient.get<ApiResponse<Parameter>>(apiRoutes.parameters.show(id)).then((r) => r.data),

  create: (input: CreateParameterInput) =>
    apiClient.post<ApiResponse<Parameter>>(apiRoutes.parameters.create, input).then((r) => r.data),

  update: (id: string, input: UpdateParameterInput) =>
    apiClient.put<ApiResponse<Parameter>>(apiRoutes.parameters.update(id), input).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.parameters.delete(id)).then((r) => r.data),
};
