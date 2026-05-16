import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vignetteService } from '@/services/vignette.service';
import type { VignetteFilters, CreateVignetteInput, UpdateVignetteInput, MarkVignettePaidInput } from '@/types/vignette.types';

export const vignetteKeys = {
  all: ['vignettes'] as const,
  list: (filters?: VignetteFilters) => [...vignetteKeys.all, 'list', filters] as const,
  detail: (id: string) => [...vignetteKeys.all, 'detail', id] as const,
};

export function useVignettes(filters?: VignetteFilters) {
  return useQuery({ queryKey: vignetteKeys.list(filters), queryFn: () => vignetteService.list(filters) });
}
export function useVignette(id: string) {
  return useQuery({ queryKey: vignetteKeys.detail(id), queryFn: () => vignetteService.show(id), enabled: !!id });
}
export function useCreateVignette() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateVignetteInput) => vignetteService.create(input), onSuccess: () => qc.invalidateQueries({ queryKey: vignetteKeys.all }) });
}
export function useUpdateVignette(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateVignetteInput) => vignetteService.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: vignetteKeys.all }) });
}
export function useDeleteVignette() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => vignetteService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: vignetteKeys.all }) });
}
export function useRestoreVignette() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => vignetteService.restore(id), onSuccess: () => qc.invalidateQueries({ queryKey: vignetteKeys.all }) });
}
export function useMarkVignettePaid() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: MarkVignettePaidInput }) => vignetteService.markPaid(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: vignetteKeys.all }) });
}
