import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/services/role.service';
import type { CreateRoleInput, UpdateRoleInput, AssignPermissionsInput } from '@/types/role.types';

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  detail: (id: string) => [...roleKeys.all, 'detail', id] as const,
  permissions: () => ['permissions'] as const,
};

export function useRoles() {
  return useQuery({ queryKey: roleKeys.list(), queryFn: () => roleService.list() });
}
export function useRole(id: string) {
  return useQuery({ queryKey: roleKeys.detail(id), queryFn: () => roleService.show(id), enabled: !!id });
}
export function usePermissions() {
  return useQuery({ queryKey: roleKeys.permissions(), queryFn: () => roleService.permissions() });
}
export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateRoleInput) => roleService.create(input), onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }) });
}
export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateRoleInput) => roleService.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }) });
}
export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => roleService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }) });
}
export function useAssignPermissions(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: AssignPermissionsInput) => roleService.assignPermissions(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }) });
}
