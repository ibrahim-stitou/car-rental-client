import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { websiteService } from '@/services/website.service';
import type {
  AddWebRequestEventInput,
  PhotoOwnerType,
  PickupPointInput,
  RejectWebRequestInput,
  RentalConditions,
  UpdateWebsiteAgencyInput,
  UpdateWebsiteVehicleInput,
  WebRequestFilters,
  WebsiteCatalogFilters,
  WebsiteContent,
  WebsiteExtraInput,
} from '@/types/website.types';

const ALL = ['website'] as const;

export const websiteKeys = {
  all:          ALL,
  requests:     [...ALL, 'requests'] as const,
  requestList:  (f?: WebRequestFilters) => [...ALL, 'requests', 'list', f] as const,
  requestStats: [...ALL, 'requests', 'stats'] as const,
  request:      (id: string) => [...ALL, 'requests', 'detail', id] as const,
  availability: (id: string, vehicleId?: string) => [...ALL, 'requests', 'availability', id, vehicleId] as const,
  clientMatches: (id: string) => [...ALL, 'requests', 'client-matches', id] as const,
  vehicles:     [...ALL, 'vehicles'] as const,
  vehicleList:  (f?: WebsiteCatalogFilters) => [...ALL, 'vehicles', 'list', f] as const,
  vehicle:      (id: string) => [...ALL, 'vehicles', 'detail', id] as const,
  agencies:     [...ALL, 'agencies'] as const,
  agency:       (id: string) => [...ALL, 'agencies', 'detail', id] as const,
  content:      [...ALL, 'content'] as const,
  conditions:   [...ALL, 'conditions'] as const,
  extras:       [...ALL, 'extras'] as const,
};

/* ─── Demandes ────────────────────────────────────────────────────────────── */

export function useWebRequests(filters?: WebRequestFilters, enabled = true) {
  return useQuery({
    queryKey: websiteKeys.requestList(filters),
    queryFn: () => websiteService.listRequests(filters),
    enabled,
  });
}

export function useWebRequestStats(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: websiteKeys.requestStats,
    queryFn: () => websiteService.requestStats(),
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled ?? true,
  });
}

export function useWebRequest(id: string) {
  return useQuery({
    queryKey: websiteKeys.request(id),
    queryFn: () => websiteService.showRequest(id),
    enabled: !!id,
  });
}

export function useWebRequestAvailability(id: string, vehicleId?: string, enabled = true) {
  return useQuery({
    queryKey: websiteKeys.availability(id, vehicleId),
    queryFn: () => websiteService.requestAvailability(id, vehicleId),
    enabled: !!id && enabled,
  });
}

export function useWebRequestClientMatches(id: string) {
  return useQuery({
    queryKey: websiteKeys.clientMatches(id),
    queryFn: () => websiteService.requestClientMatches(id),
    enabled: !!id,
  });
}

export function useAssignWebRequest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id?: string; unassign?: boolean }) => websiteService.assignRequest(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.requests }),
  });
}

export function useAddWebRequestEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddWebRequestEventInput) => websiteService.addRequestEvent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.requests }),
  });
}

export function useConvertWebRequest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => websiteService.convertRequest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: websiteKeys.requests });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useRejectWebRequest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RejectWebRequestInput) => websiteService.rejectRequest(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.requests }),
  });
}

/* ─── Catalogue : véhicules ───────────────────────────────────────────────── */

export function useWebsiteVehicles(filters?: WebsiteCatalogFilters) {
  return useQuery({
    queryKey: websiteKeys.vehicleList(filters),
    queryFn: () => websiteService.listVehicles(filters),
  });
}

export function useWebsiteVehicle(id: string) {
  return useQuery({
    queryKey: websiteKeys.vehicle(id),
    queryFn: () => websiteService.showVehicle(id),
    enabled: !!id,
  });
}

export function useUpdateWebsiteVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWebsiteVehicleInput) => websiteService.updateVehicle(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.vehicles }),
  });
}

export function usePublishWebsiteVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publish: boolean) => (publish ? websiteService.publishVehicle(id) : websiteService.unpublishVehicle(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.vehicles }),
  });
}

export function useCopyWebsiteVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, withPhotos }: { sourceId: string; withPhotos: boolean }) =>
      websiteService.copyVehicle(id, sourceId, withPhotos),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.vehicles }),
  });
}

/* ─── Catalogue : agences ─────────────────────────────────────────────────── */

export function useWebsiteAgencies() {
  return useQuery({
    queryKey: websiteKeys.agencies,
    queryFn: () => websiteService.listAgencies(),
  });
}

export function useWebsiteAgency(id: string) {
  return useQuery({
    queryKey: websiteKeys.agency(id),
    queryFn: () => websiteService.showAgency(id),
    enabled: !!id,
  });
}

export function useUpdateWebsiteAgency(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWebsiteAgencyInput) => websiteService.updateAgency(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.agencies }),
  });
}

export function usePublishWebsiteAgency(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publish: boolean) => (publish ? websiteService.publishAgency(id) : websiteService.unpublishAgency(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: websiteKeys.agencies });
      // Retirer une agence masque aussi ses véhicules
      qc.invalidateQueries({ queryKey: websiteKeys.vehicles });
    },
  });
}

export function useSavePickupPoint(agencyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pointId, data }: { pointId?: string; data: PickupPointInput }) =>
      pointId ? websiteService.updatePickupPoint(agencyId, pointId, data) : websiteService.createPickupPoint(agencyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.agency(agencyId) }),
  });
}

export function useDeletePickupPoint(agencyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pointId: string) => websiteService.deletePickupPoint(agencyId, pointId),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.agency(agencyId) }),
  });
}

/* ─── Photos ──────────────────────────────────────────────────────────────── */

function photoOwnerKey(type: PhotoOwnerType, id: string) {
  return type === 'vehicles' ? websiteKeys.vehicle(id) : websiteKeys.agency(id);
}

export function useWebsitePhotos(type: PhotoOwnerType, id: string) {
  const qc = useQueryClient();
  const onSuccess = () => {
    qc.invalidateQueries({ queryKey: photoOwnerKey(type, id) });
    qc.invalidateQueries({ queryKey: type === 'vehicles' ? websiteKeys.vehicles : websiteKeys.agencies });
  };

  return {
    upload: useMutation({ mutationFn: (files: File[]) => websiteService.uploadPhotos(type, id, files), onSuccess }),
    reorder: useMutation({ mutationFn: (mediaIds: number[]) => websiteService.reorderPhotos(type, id, mediaIds), onSuccess }),
    update: useMutation({
      mutationFn: ({ mediaId, data }: { mediaId: number; data: { alt?: string | null; is_cover?: boolean } }) =>
        websiteService.updatePhoto(type, id, mediaId, data),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: (mediaId: number) => websiteService.deletePhoto(type, id, mediaId), onSuccess }),
  };
}

/* ─── Contenu, conditions, options ────────────────────────────────────────── */

export function useWebsiteContent() {
  return useQuery({ queryKey: websiteKeys.content, queryFn: () => websiteService.content() });
}

export function useUpdateWebsiteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WebsiteContent) => websiteService.updateContent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.content }),
  });
}

export function useRentalConditions() {
  return useQuery({ queryKey: websiteKeys.conditions, queryFn: () => websiteService.conditions() });
}

export function useUpdateRentalConditions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RentalConditions>) => websiteService.updateConditions(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.conditions }),
  });
}

export function useWebsiteExtras(enabled = true) {
  return useQuery({ queryKey: websiteKeys.extras, queryFn: () => websiteService.listExtras(), enabled });
}

export function useSaveWebsiteExtra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: WebsiteExtraInput }) =>
      id ? websiteService.updateExtra(id, data) : websiteService.createExtra(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.extras }),
  });
}

export function useDeleteWebsiteExtra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => websiteService.deleteExtra(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.extras }),
  });
}
