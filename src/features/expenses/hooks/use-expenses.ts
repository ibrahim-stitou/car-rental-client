import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '@/services/expense.service';
import type { ExpenseFilters, CreateExpenseInput, UpdateExpenseInput } from '@/types/expense.types';

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (filters?: ExpenseFilters) => [...expenseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...expenseKeys.all, 'detail', id] as const,
  statistics: (params?: object) => [...expenseKeys.all, 'statistics', params] as const,
};

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expenseService.list(filters),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expenseService.show(id),
    enabled: !!id,
  });
}

export function useExpenseStatistics(params?: { agency_id?: string; vehicle_id?: string }) {
  return useQuery({
    queryKey: expenseKeys.statistics(params),
    queryFn: () => expenseService.statistics(params),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expenseService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useUpdateExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateExpenseInput) => expenseService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}
