import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { User, CreateUserInput, UpdateUserInput, UserFilters } from '@/types/user.types';
import type { UserRole } from '@/types/auth.types';

export const userService = {
  list: (filters?: UserFilters) =>
    apiClient.get<PaginatedResponse<User>>(apiRoutes.users.list, { params: filters }).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<User>>(apiRoutes.users.show(id)).then((r) => r.data),
  create: (input: CreateUserInput) =>
    apiClient.post<ApiResponse<User>>(apiRoutes.users.create, input).then((r) => r.data),
  update: (id: string, input: UpdateUserInput) =>
    apiClient.put<ApiResponse<User>>(apiRoutes.users.update(id), input).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.users.delete(id)).then((r) => r.data),
  restore: (id: string) =>
    apiClient.post<ApiResponse<User>>(apiRoutes.users.restore(id)).then((r) => r.data),
  activate: (id: string) =>
    apiClient.post<ApiResponse<User>>(apiRoutes.users.activate(id)).then((r) => r.data),
  suspend: (id: string) =>
    apiClient.post<ApiResponse<User>>(apiRoutes.users.suspend(id)).then((r) => r.data),
  assignRole: (id: string, role: UserRole) =>
    apiClient.post<ApiResponse<User>>(apiRoutes.users.assignRole(id), { role }).then((r) => r.data),
  profile: () =>
    apiClient.get<ApiResponse<User>>(apiRoutes.users.profile).then((r) => r.data),
  updateProfile: (input: UpdateUserInput) =>
    apiClient.put<ApiResponse<User>>(apiRoutes.users.updateProfile, input).then((r) => r.data),
};
