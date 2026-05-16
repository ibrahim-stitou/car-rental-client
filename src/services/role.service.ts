import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Role, Permission, CreateRoleInput, UpdateRoleInput, AssignPermissionsInput } from '@/types/role.types';

export const roleService = {
  list: () =>
    apiClient.get<PaginatedResponse<Role>>(apiRoutes.roles.list).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<Role>>(apiRoutes.roles.show(id)).then((r) => r.data),
  create: (input: CreateRoleInput) =>
    apiClient.post<ApiResponse<Role>>(apiRoutes.roles.create, input).then((r) => r.data),
  update: (id: string, input: UpdateRoleInput) =>
    apiClient.put<ApiResponse<Role>>(apiRoutes.roles.update(id), input).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.roles.delete(id)).then((r) => r.data),
  assignPermissions: (id: string, input: AssignPermissionsInput) =>
    apiClient.post<ApiResponse<Role>>(apiRoutes.roles.assignPermissions(id), input).then((r) => r.data),
  permissions: () =>
    apiClient.get<ApiResponse<Permission[]>>(apiRoutes.permissions.list).then((r) => r.data),
};
