import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '@/services/client.service';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ClientFilters, CreateClientInput, UpdateClientInput } from '@/types/client.types';

export const clientKeys = {
  all: ['clients'] as const,
  list: (filters?: ClientFilters) => [...clientKeys.all, 'list', filters] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
  statistics: (id: string) => [...clientKeys.all, 'statistics', id] as const,
  reservations: (id: string) => [...clientKeys.all, 'reservations', id] as const,
};

export function useClients(filters?: ClientFilters) {
  return useQuery({ queryKey: clientKeys.list(filters), queryFn: () => clientService.list(filters) });
}
export function useClient(id: string) {
  return useQuery({ queryKey: clientKeys.detail(id), queryFn: () => clientService.show(id), enabled: !!id });
}
export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateClientInput) => clientService.create(input), onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }) });
}
export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateClientInput) => clientService.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }) });
}
export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => clientService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }) });
}
export function useRestoreClient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => clientService.restore(id), onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }) });
}

export function useClientStatistics(id: string) {
  return useQuery({
    queryKey: clientKeys.statistics(id),
    queryFn: () => apiClient.get(apiRoutes.clientsExt.statistics(id)).then((r) => r.data),
    enabled: !!id,
  });
}

export function useClientReservations(id: string, params?: { per_page?: number; page?: number }) {
  return useQuery({
    queryKey: clientKeys.reservations(id),
    queryFn: () => apiClient.get(apiRoutes.clientsExt.reservations(id), { params }).then((r) => r.data),
    enabled: !!id,
  });
}
