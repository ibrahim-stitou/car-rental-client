import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Reservation } from '@/types/reservation.types';
import type {
  AddWebRequestEventInput,
  ClientMatch,
  PhotoOwnerType,
  PickupPoint,
  PickupPointInput,
  RejectWebRequestInput,
  RentalConditions,
  UpdateWebsiteAgencyInput,
  UpdateWebsiteVehicleInput,
  WebRequest,
  WebRequestAvailability,
  WebRequestFilters,
  WebRequestStats,
  WebsiteAgency,
  WebsiteCatalogFilters,
  WebsiteContent,
  WebsiteExtra,
  WebsiteExtraInput,
  WebsitePhoto,
  WebsiteVehicle,
} from '@/types/website.types';

const r = apiRoutes.website;

/** Laravel's boolean rule rejects "true"/"false" in a query string: send 1/0. */
function toQuery<T extends object>(params?: T) {
  if (!params) return undefined;
  return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, typeof v === 'boolean' ? Number(v) : v]));
}

export const websiteService = {
  // ─── Demandes ──────────────────────────────────────────────────────────────
  listRequests: (params?: WebRequestFilters) =>
    apiClient.get<PaginatedResponse<WebRequest>>(r.requests, { params: toQuery(params) }).then((res) => res.data),

  requestStats: () =>
    apiClient.get<ApiResponse<WebRequestStats>>(r.requestStats).then((res) => res.data),

  showRequest: (id: string) =>
    apiClient.get<ApiResponse<WebRequest>>(r.request(id)).then((res) => res.data),

  assignRequest: (id: string, data: { user_id?: string; unassign?: boolean }) =>
    apiClient.post<ApiResponse<WebRequest>>(r.assignRequest(id), data).then((res) => res.data),

  addRequestEvent: (id: string, data: AddWebRequestEventInput) =>
    apiClient.post<ApiResponse<WebRequest>>(r.requestEvents(id), data).then((res) => res.data),

  requestAvailability: (id: string, vehicleId?: string) =>
    apiClient
      .get<ApiResponse<WebRequestAvailability>>(r.requestAvailability(id), { params: { vehicle_id: vehicleId } })
      .then((res) => res.data),

  requestClientMatches: (id: string) =>
    apiClient.get<ApiResponse<ClientMatch[]>>(r.requestClientMatches(id)).then((res) => res.data),

  convertRequest: (id: string, data: Record<string, unknown>) =>
    apiClient
      .post<ApiResponse<{ request: WebRequest; reservation: Reservation }>>(r.convertRequest(id), data)
      .then((res) => res.data),

  rejectRequest: (id: string, data: RejectWebRequestInput) =>
    apiClient.post<ApiResponse<WebRequest>>(r.rejectRequest(id), data).then((res) => res.data),

  // ─── Catalogue : véhicules ─────────────────────────────────────────────────
  listVehicles: (params?: WebsiteCatalogFilters) =>
    apiClient.get<PaginatedResponse<WebsiteVehicle>>(r.vehicles, { params: toQuery(params) }).then((res) => res.data),

  showVehicle: (id: string) =>
    apiClient.get<ApiResponse<WebsiteVehicle>>(r.vehicle(id)).then((res) => res.data),

  updateVehicle: (id: string, data: UpdateWebsiteVehicleInput) =>
    apiClient.patch<ApiResponse<WebsiteVehicle>>(r.vehicle(id), data).then((res) => res.data),

  publishVehicle: (id: string) =>
    apiClient.post<ApiResponse<WebsiteVehicle>>(r.publishVehicle(id)).then((res) => res.data),

  unpublishVehicle: (id: string) =>
    apiClient.post<ApiResponse<WebsiteVehicle>>(r.unpublishVehicle(id)).then((res) => res.data),

  copyVehicle: (id: string, sourceId: string, withPhotos: boolean) =>
    apiClient
      .post<ApiResponse<WebsiteVehicle>>(r.copyVehicle(id, sourceId), { with_photos: withPhotos })
      .then((res) => res.data),

  // ─── Catalogue : agences ───────────────────────────────────────────────────
  listAgencies: () =>
    apiClient.get<ApiResponse<WebsiteAgency[]>>(r.agencies).then((res) => res.data),

  showAgency: (id: string) =>
    apiClient.get<ApiResponse<WebsiteAgency>>(r.agency(id)).then((res) => res.data),

  updateAgency: (id: string, data: UpdateWebsiteAgencyInput) =>
    apiClient.patch<ApiResponse<WebsiteAgency>>(r.agency(id), data).then((res) => res.data),

  publishAgency: (id: string) =>
    apiClient.post<ApiResponse<WebsiteAgency>>(r.publishAgency(id)).then((res) => res.data),

  unpublishAgency: (id: string) =>
    apiClient.post<ApiResponse<WebsiteAgency>>(r.unpublishAgency(id)).then((res) => res.data),

  createPickupPoint: (agencyId: string, data: PickupPointInput) =>
    apiClient.post<ApiResponse<PickupPoint>>(r.pickupPoints(agencyId), data).then((res) => res.data),

  updatePickupPoint: (agencyId: string, pointId: string, data: Partial<PickupPointInput>) =>
    apiClient.patch<ApiResponse<PickupPoint>>(r.pickupPoint(agencyId, pointId), data).then((res) => res.data),

  deletePickupPoint: (agencyId: string, pointId: string) =>
    apiClient.delete<ApiResponse<null>>(r.pickupPoint(agencyId, pointId)).then((res) => res.data),

  // ─── Photos (véhicules et agences) ─────────────────────────────────────────
  uploadPhotos: (type: PhotoOwnerType, id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append('photos[]', file));
    return apiClient.post<ApiResponse<WebsitePhoto[]>>(r.photos(type, id), form).then((res) => res.data);
  },

  reorderPhotos: (type: PhotoOwnerType, id: string, mediaIds: number[]) =>
    apiClient.put<ApiResponse<WebsitePhoto[]>>(r.photosOrder(type, id), { media_ids: mediaIds }).then((res) => res.data),

  updatePhoto: (type: PhotoOwnerType, id: string, mediaId: number, data: { alt?: string | null; is_cover?: boolean }) =>
    apiClient.patch<ApiResponse<WebsitePhoto[]>>(r.photo(type, id, mediaId), data).then((res) => res.data),

  deletePhoto: (type: PhotoOwnerType, id: string, mediaId: number) =>
    apiClient.delete<ApiResponse<WebsitePhoto[]>>(r.photo(type, id, mediaId)).then((res) => res.data),

  // ─── Contenu, conditions, options ──────────────────────────────────────────
  content: () =>
    apiClient.get<ApiResponse<WebsiteContent>>(r.content).then((res) => res.data),

  updateContent: (data: WebsiteContent) =>
    apiClient.put<ApiResponse<WebsiteContent>>(r.content, data).then((res) => res.data),

  conditions: () =>
    apiClient.get<ApiResponse<RentalConditions>>(r.conditions).then((res) => res.data),

  updateConditions: (data: Partial<RentalConditions>) =>
    apiClient.put<ApiResponse<RentalConditions>>(r.conditions, data).then((res) => res.data),

  listExtras: () =>
    apiClient.get<ApiResponse<WebsiteExtra[]>>(r.extras).then((res) => res.data),

  createExtra: (data: WebsiteExtraInput) =>
    apiClient.post<ApiResponse<WebsiteExtra>>(r.extras, data).then((res) => res.data),

  updateExtra: (id: string, data: Partial<WebsiteExtraInput>) =>
    apiClient.patch<ApiResponse<WebsiteExtra>>(r.extra(id), data).then((res) => res.data),

  deleteExtra: (id: string) =>
    apiClient.delete<ApiResponse<null>>(r.extra(id)).then((res) => res.data),
};
