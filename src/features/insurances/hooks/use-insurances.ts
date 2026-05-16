import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insuranceService } from '@/services/insurance.service';
import type { InsuranceFilters, CreateInsuranceInput, UpdateInsuranceInput } from '@/types/insurance.types';

export const insuranceKeys = {
  all: ['insurances'] as const,
  list: (filters?: InsuranceFilters) => [...insuranceKeys.all, 'list', filters] as const,
  detail: (id: string) => [...insuranceKeys.all, 'detail', id] as const,
};

export function useInsurances(filters?: InsuranceFilters) {
  return useQuery({ queryKey: insuranceKeys.list(filters), queryFn: () => insuranceService.list(filters) });
}
export function useInsurance(id: string) {
  return useQuery({ queryKey: insuranceKeys.detail(id), queryFn: () => insuranceService.show(id), enabled: !!id });
}
export function useCreateInsurance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateInsuranceInput) => insuranceService.create(input), onSuccess: () => qc.invalidateQueries({ queryKey: insuranceKeys.all }) });
}
export function useUpdateInsurance(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateInsuranceInput) => insuranceService.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: insuranceKeys.all }) });
}
export function useDeleteInsurance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => insuranceService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: insuranceKeys.all }) });
}
export function useRestoreInsurance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => insuranceService.restore(id), onSuccess: () => qc.invalidateQueries({ queryKey: insuranceKeys.all }) });
}
