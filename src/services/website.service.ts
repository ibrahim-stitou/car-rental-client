import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { WebReservation, WebsiteStats, WebsiteVehicleUpdate } from '@/types/website.types';
import type { Vehicle } from '@/types/vehicle.types';

export const websiteService = {
  stats: () =>
    apiClient.get<ApiResponse<WebsiteStats>>(apiRoutes.website.stats).then((r) => r.data),

  listReservations: (params?: { status?: string; per_page?: number; page?: number }) =>
    apiClient
      .get<PaginatedResponse<WebReservation>>(apiRoutes.website.reservations, { params })
      .then((r) => r.data),

  showReservation: (id: string) =>
    apiClient
      .get<ApiResponse<WebReservation>>(apiRoutes.website.showReservation(id))
      .then((r) => r.data),

  approveReservation: (id: string) =>
    apiClient
      .patch<ApiResponse<WebReservation>>(apiRoutes.website.approveReservation(id))
      .then((r) => r.data),

  rejectReservation: (id: string, reason: string) =>
    apiClient
      .patch<ApiResponse<WebReservation>>(apiRoutes.website.rejectReservation(id), { reason })
      .then((r) => r.data),

  listVehicles: (params?: { agency_id?: string; show_on_website?: boolean; per_page?: number }) =>
    apiClient
      .get<PaginatedResponse<Vehicle>>(apiRoutes.website.vehicles, { params })
      .then((r) => r.data),

  updateVehicle: (id: string, data: WebsiteVehicleUpdate) =>
    apiClient
      .patch<ApiResponse<Vehicle>>(apiRoutes.website.updateVehicle(id), data)
      .then((r) => r.data),
};
