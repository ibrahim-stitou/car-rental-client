import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type {
  Reservation, CreateReservationInput, UpdateReservationInput,
  ActivateReservationInput, CompleteReservationInput, CancelReservationInput,
  CalendarReservation, ReservationStatistics, ReservationFilters,
} from '@/types/reservation.types';

export const reservationService = {
  list: (filters?: ReservationFilters) =>
    apiClient.get<PaginatedResponse<Reservation>>(apiRoutes.reservations.list, { params: filters }).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<Reservation>>(apiRoutes.reservations.show(id)).then((r) => r.data),
  create: (input: CreateReservationInput) =>
    apiClient.post<ApiResponse<Reservation>>(apiRoutes.reservations.create, input).then((r) => r.data),
  update: (id: string, input: UpdateReservationInput) =>
    apiClient.put<ApiResponse<Reservation>>(apiRoutes.reservations.update(id), input).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.reservations.delete(id)).then((r) => r.data),
  activate: (id: string, input: ActivateReservationInput) =>
    apiClient.post<ApiResponse<Reservation>>(apiRoutes.reservations.activate(id), input).then((r) => r.data),
  complete: (id: string, input: CompleteReservationInput) =>
    apiClient.post<ApiResponse<Reservation>>(apiRoutes.reservations.complete(id), input).then((r) => r.data),
  cancel: (id: string, input: CancelReservationInput) =>
    apiClient.post<ApiResponse<Reservation>>(apiRoutes.reservations.cancel(id), input).then((r) => r.data),
  calendar: (params?: { start_date?: string; end_date?: string }) =>
    apiClient.get<ApiResponse<CalendarReservation[]>>(apiRoutes.reservations.calendar, { params }).then((r) => r.data),
  statistics: () =>
    apiClient.get<ApiResponse<ReservationStatistics>>(apiRoutes.reservations.statistics).then((r) => r.data),
};
