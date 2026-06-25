import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agencyService } from '@/services/agency.service';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { AgencyFilters, CreateAgencyInput, UpdateAgencyInput } from '@/types/agency.types';

export const agencyKeys = {
  all: ['agencies'] as const,
  list: (filters?: AgencyFilters) => [...agencyKeys.all, 'list', filters] as const,
  detail: (id: string) => [...agencyKeys.all, 'detail', id] as const,
  statistics: (id: string) => [...agencyKeys.all, 'statistics', id] as const,
};

export function useAgencies(filters?: AgencyFilters) {
  return useQuery({
    queryKey: agencyKeys.list(filters),
    queryFn: () => agencyService.list(filters),
  });
}

export function useAgency(id: string) {
  return useQuery({
    queryKey: agencyKeys.detail(id),
    queryFn: () => agencyService.show(id),
    enabled: !!id,
  });
}

export function useCreateAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAgencyInput) => agencyService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: agencyKeys.all }),
  });
}

export function useUpdateAgency(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAgencyInput) => agencyService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: agencyKeys.all }),
  });
}

export function useDeleteAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agencyService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: agencyKeys.all }),
  });
}

export function useRestoreAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agencyService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: agencyKeys.all }),
  });
}

export function useUploadAgencyLogo(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => agencyService.uploadLogo(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: agencyKeys.all }),
  });
}

export function useDeleteAgencyMedia(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: number) => agencyService.deleteMedia(id, mediaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: agencyKeys.all }),
  });
}

export function useAgencyStatistics(id: string) {
  return useQuery({
    queryKey: agencyKeys.statistics(id),
    queryFn: () => apiClient.get(apiRoutes.agenciesExt.statistics(id)).then((r) => r.data),
    enabled: !!id,
  });
}
