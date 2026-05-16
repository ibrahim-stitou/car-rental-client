import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationService } from '@/services/reservation.service';
import type { ReservationFilters, CreateReservationInput, UpdateReservationInput, ActivateReservationInput, CompleteReservationInput, CancelReservationInput } from '@/types/reservation.types';

export const reservationKeys = {
  all: ['reservations'] as const,
  list: (filters?: ReservationFilters) => [...reservationKeys.all, 'list', filters] as const,
  detail: (id: string) => [...reservationKeys.all, 'detail', id] as const,
  calendar: (params?: object) => [...reservationKeys.all, 'calendar', params] as const,
  statistics: () => [...reservationKeys.all, 'statistics'] as const,
};

export function useReservations(filters?: ReservationFilters) {
  return useQuery({ queryKey: reservationKeys.list(filters), queryFn: () => reservationService.list(filters) });
}
export function useReservation(id: string) {
  return useQuery({ queryKey: reservationKeys.detail(id), queryFn: () => reservationService.show(id), enabled: !!id });
}
export function useReservationCalendar(params?: { start_date?: string; end_date?: string }) {
  return useQuery({ queryKey: reservationKeys.calendar(params), queryFn: () => reservationService.calendar(params) });
}
export function useReservationStatistics() {
  return useQuery({ queryKey: reservationKeys.statistics(), queryFn: () => reservationService.statistics() });
}
export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateReservationInput) => reservationService.create(input), onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }) });
}
export function useUpdateReservation(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateReservationInput) => reservationService.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }) });
}
export function useDeleteReservation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => reservationService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }) });
}
export function useActivateReservation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: ActivateReservationInput }) => reservationService.activate(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }) });
}
export function useCompleteReservation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: CompleteReservationInput }) => reservationService.complete(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }) });
}
export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: CancelReservationInput }) => reservationService.cancel(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }) });
}
