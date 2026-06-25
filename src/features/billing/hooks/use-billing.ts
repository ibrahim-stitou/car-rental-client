import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';
import type { BillingFilters, CreateBillingInput, UpdateBillingInput, MarkBillingPaidInput } from '@/types/billing.types';

export const billingKeys = {
  all: ['billing'] as const,
  list: (filters?: BillingFilters) => [...billingKeys.all, 'list', filters] as const,
  detail: (id: string) => [...billingKeys.all, 'detail', id] as const,
  history: (id: string) => [...billingKeys.all, 'history', id] as const,
  statistics: () => [...billingKeys.all, 'statistics'] as const,
};

export function useBillingDocuments(filters?: BillingFilters) {
  return useQuery({ queryKey: billingKeys.list(filters), queryFn: () => billingService.list(filters) });
}
export function useBillingDocument(id: string) {
  return useQuery({ queryKey: billingKeys.detail(id), queryFn: () => billingService.show(id), enabled: !!id });
}
export function useBillingHistory(id: string) {
  return useQuery({ queryKey: billingKeys.history(id), queryFn: () => billingService.history(id), enabled: !!id });
}
export function useBillingStatistics() {
  return useQuery({ queryKey: billingKeys.statistics(), queryFn: () => billingService.statistics() });
}
export function useCreateBillingDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateBillingInput) => billingService.create(input), onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }) });
}
export function useUpdateBillingDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateBillingInput) => billingService.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }) });
}
export function useDeleteBillingDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => billingService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }) });
}
export function useMarkBillingPaid() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: MarkBillingPaidInput }) => billingService.markPaid(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }) });
}
export function useApproveBillingDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => billingService.approve(id), onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }) });
}
export function useUnapproveBillingDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => billingService.unapprove(id, reason), onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }) });
}
export function useCreateBillingFromReservation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ reservationId, type }: { reservationId: string; type?: string }) => billingService.createFromReservation(reservationId, type), onSuccess: () => qc.invalidateQueries({ queryKey: billingKeys.all }) });
}
