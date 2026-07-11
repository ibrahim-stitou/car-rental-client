import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parameterService } from '@/services/parameter.service';
import type { ParameterFilters, CreateParameterInput, UpdateParameterInput, ParameterCategory } from '@/types/parameter.types';

export const parameterKeys = {
  all: ['parameters'] as const,
  list: (filters?: ParameterFilters) => [...parameterKeys.all, 'list', filters] as const,
};

export function useParameters(filters?: ParameterFilters) {
  return useQuery({ queryKey: parameterKeys.list(filters), queryFn: () => parameterService.list(filters) });
}

/** Convenience hook for form selects: active parameters for one category as {value,label} options. */
export function useParameterOptions(category: ParameterCategory) {
  const { data, ...rest } = useParameters({ category, is_active: true });
  return { options: (data?.data ?? []).map((p) => ({ value: p.value, label: p.label })), ...rest };
}

export function useCreateParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateParameterInput) => parameterService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: parameterKeys.all }),
  });
}

export function useUpdateParameter(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateParameterInput) => parameterService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: parameterKeys.all }),
  });
}

export function useDeleteParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => parameterService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: parameterKeys.all }),
  });
}
