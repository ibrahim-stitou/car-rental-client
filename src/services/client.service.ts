import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Client, CreateClientInput, UpdateClientInput, ClientFilters } from '@/types/client.types';

export const clientService = {
  list: (filters?: ClientFilters) =>
    apiClient.get<PaginatedResponse<Client>>(apiRoutes.clients.list, { params: filters }).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<Client>>(apiRoutes.clients.show(id)).then((r) => r.data),
  create: (input: CreateClientInput) =>
    apiClient.post<ApiResponse<Client>>(apiRoutes.clients.create, input).then((r) => r.data),
  update: (id: string, input: UpdateClientInput) =>
    apiClient.put<ApiResponse<Client>>(apiRoutes.clients.update(id), input).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.clients.delete(id)).then((r) => r.data),
  restore: (id: string) =>
    apiClient.post<ApiResponse<Client>>(apiRoutes.clients.restore(id)).then((r) => r.data),
};
