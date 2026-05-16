import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import type { UserFilters, CreateUserInput, UpdateUserInput } from '@/types/user.types';
import type { UserRole } from '@/types/auth.types';

export const userKeys = {
  all: ['users'] as const,
  list: (filters?: UserFilters) => [...userKeys.all, 'list', filters] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

export function useUsers(filters?: UserFilters) {
  return useQuery({ queryKey: userKeys.list(filters), queryFn: () => userService.list(filters) });
}
export function useUser(id: string) {
  return useQuery({ queryKey: userKeys.detail(id), queryFn: () => userService.show(id), enabled: !!id });
}
export function useUserProfile() {
  return useQuery({ queryKey: userKeys.profile(), queryFn: () => userService.profile() });
}
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateUserInput) => userService.create(input), onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }) });
}
export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateUserInput) => userService.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }) });
}
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => userService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }) });
}
export function useRestoreUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => userService.restore(id), onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }) });
}
export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => userService.activate(id), onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }) });
}
export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => userService.suspend(id), onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }) });
}
export function useAssignUserRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, role }: { id: string; role: UserRole }) => userService.assignRole(id, role), onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }) });
}
