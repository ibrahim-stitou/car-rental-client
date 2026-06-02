import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ClaimFilters, CreateClaimInput, UpdateClaimInput, ClaimStatus } from '@/types/claim.types';

const ALL = ['claims'] as const;

export const claimKeys = {
  all:        ALL,
  list:       (f?: ClaimFilters) => [...ALL, 'list', f] as const,
  detail:     (id: string) => [...ALL, 'detail', id] as const,
  statistics: [...ALL, 'statistics'] as const,
};

export function useClaims(filters?: ClaimFilters) {
  return useQuery({
    queryKey: claimKeys.list(filters),
    queryFn: () => apiClient.get(apiRoutes.claims.list, { params: filters }).then(r => r.data),
  });
}

export function useClaim(id: string) {
  return useQuery({
    queryKey: claimKeys.detail(id),
    queryFn: () => apiClient.get(apiRoutes.claims.show(id)).then(r => r.data),
    enabled: !!id,
  });
}

export function useClaimStatistics() {
  return useQuery({
    queryKey: claimKeys.statistics,
    queryFn: () => apiClient.get(apiRoutes.claims.statistics).then(r => r.data),
  });
}

export function useCreateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClaimInput) => apiClient.post(apiRoutes.claims.create, input).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: claimKeys.all }),
  });
}

export function useUpdateClaim(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClaimInput) => apiClient.put(apiRoutes.claims.update(id), input).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: claimKeys.all }),
  });
}

export function useDeleteClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(apiRoutes.claims.delete(id)).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: claimKeys.all }),
  });
}

export function useUpdateClaimStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: ClaimStatus) => apiClient.patch(apiRoutes.claims.updateStatus(id), { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: claimKeys.all }),
  });
}
