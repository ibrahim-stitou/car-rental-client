import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '@/services/maintenance.service';
import type { MaintenanceFilters, CreateMaintenanceInput, UpdateMaintenanceInput, MaintenanceStatus } from '@/types/maintenance.types';

export const maintenanceKeys = {
  all: ['maintenances'] as const,
  list: (filters?: MaintenanceFilters) => [...maintenanceKeys.all, 'list', filters] as const,
  detail: (id: string) => [...maintenanceKeys.all, 'detail', id] as const,
};

export function useMaintenances(filters?: MaintenanceFilters) {
  return useQuery({ queryKey: maintenanceKeys.list(filters), queryFn: () => maintenanceService.list(filters) });
}
export function useMaintenance(id: string) {
  return useQuery({ queryKey: maintenanceKeys.detail(id), queryFn: () => maintenanceService.show(id), enabled: !!id });
}
export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateMaintenanceInput) => maintenanceService.create(input), onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.all }) });
}
export function useUpdateMaintenance(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateMaintenanceInput) => maintenanceService.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.all }) });
}
export function useDeleteMaintenance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => maintenanceService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.all }) });
}
export function useRestoreMaintenance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => maintenanceService.restore(id), onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.all }) });
}
export function useUpdateMaintenanceStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: MaintenanceStatus }) => maintenanceService.updateStatus(id, status), onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.all }) });
}
