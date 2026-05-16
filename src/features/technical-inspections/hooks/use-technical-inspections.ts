import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { technicalInspectionService } from '@/services/technical-inspection.service';
import type { TechnicalInspectionFilters, CreateTechnicalInspectionInput, UpdateTechnicalInspectionInput } from '@/types/technical-inspection.types';

export const inspectionKeys = {
  all: ['technical-inspections'] as const,
  list: (filters?: TechnicalInspectionFilters) => [...inspectionKeys.all, 'list', filters] as const,
  detail: (id: string) => [...inspectionKeys.all, 'detail', id] as const,
};

export function useTechnicalInspections(filters?: TechnicalInspectionFilters) {
  return useQuery({ queryKey: inspectionKeys.list(filters), queryFn: () => technicalInspectionService.list(filters) });
}
export function useTechnicalInspection(id: string) {
  return useQuery({ queryKey: inspectionKeys.detail(id), queryFn: () => technicalInspectionService.show(id), enabled: !!id });
}
export function useCreateTechnicalInspection() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateTechnicalInspectionInput) => technicalInspectionService.create(input), onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.all }) });
}
export function useUpdateTechnicalInspection(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateTechnicalInspectionInput) => technicalInspectionService.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.all }) });
}
export function useDeleteTechnicalInspection() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => technicalInspectionService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.all }) });
}
export function useRestoreTechnicalInspection() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => technicalInspectionService.restore(id), onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.all }) });
}
