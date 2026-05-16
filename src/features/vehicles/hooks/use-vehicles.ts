import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '@/services/vehicle.service';
import type { VehicleFilters, CreateVehicleInput, UpdateVehicleInput, VehicleStatus } from '@/types/vehicle.types';

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: (filters?: VehicleFilters) => [...vehicleKeys.all, 'list', filters] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
};

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: () => vehicleService.list(filters),
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehicleService.show(id),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVehicleInput) => vehicleService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateVehicleInput) => vehicleService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useRestoreVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useUpdateVehicleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VehicleStatus }) =>
      vehicleService.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}
