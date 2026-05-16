import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Vehicle, CreateVehicleInput, UpdateVehicleInput, VehicleFilters, VehicleStatus } from '@/types/vehicle.types';

export const vehicleService = {
  list: (filters?: VehicleFilters) =>
    apiClient
      .get<PaginatedResponse<Vehicle>>(apiRoutes.vehicles.list, { params: filters })
      .then((r) => r.data),

  show: (id: string) =>
    apiClient
      .get<ApiResponse<Vehicle>>(apiRoutes.vehicles.show(id))
      .then((r) => r.data),

  create: (input: CreateVehicleInput) =>
    apiClient
      .post<ApiResponse<Vehicle>>(apiRoutes.vehicles.create, input)
      .then((r) => r.data),

  update: (id: string, input: UpdateVehicleInput) =>
    apiClient
      .put<ApiResponse<Vehicle>>(apiRoutes.vehicles.update(id), input)
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.vehicles.delete(id)).then((r) => r.data),

  restore: (id: string) =>
    apiClient
      .post<ApiResponse<Vehicle>>(apiRoutes.vehicles.restore(id))
      .then((r) => r.data),

  updateStatus: (id: string, status: VehicleStatus) =>
    apiClient
      .patch<ApiResponse<Vehicle>>(apiRoutes.vehicles.updateStatus(id), { status })
      .then((r) => r.data),
};
