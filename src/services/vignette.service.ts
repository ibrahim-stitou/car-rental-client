import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Vignette, CreateVignetteInput, UpdateVignetteInput, MarkVignettePaidInput, VignetteFilters } from '@/types/vignette.types';

export const vignetteService = {
  list: (filters?: VignetteFilters) =>
    apiClient.get<PaginatedResponse<Vignette>>(apiRoutes.vignettes.list, { params: filters }).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<Vignette>>(apiRoutes.vignettes.show(id)).then((r) => r.data),
  create: (input: CreateVignetteInput) =>
    apiClient.post<ApiResponse<Vignette>>(apiRoutes.vignettes.create, input).then((r) => r.data),
  update: (id: string, input: UpdateVignetteInput) =>
    apiClient.put<ApiResponse<Vignette>>(apiRoutes.vignettes.update(id), input).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.vignettes.delete(id)).then((r) => r.data),
  restore: (id: string) =>
    apiClient.post<ApiResponse<Vignette>>(apiRoutes.vignettes.restore(id)).then((r) => r.data),
  markPaid: (id: string, input: MarkVignettePaidInput) =>
    apiClient.post<ApiResponse<Vignette>>(apiRoutes.vignettes.markPaid(id), input).then((r) => r.data),
};
