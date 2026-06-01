import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { websiteService } from '@/services/website.service';
import type { WebsiteVehicleUpdate } from '@/types/website.types';

export const websiteKeys = {
  all: ['website'] as const,
  stats: () => [...websiteKeys.all, 'stats'] as const,
  reservations: (params?: object) => [...websiteKeys.all, 'reservations', params] as const,
  vehicles: (params?: object) => [...websiteKeys.all, 'vehicles', params] as const,
};

export function useWebsiteStats() {
  return useQuery({
    queryKey: websiteKeys.stats(),
    queryFn: () => websiteService.stats(),
  });
}

export function useWebReservations(params?: { status?: string; per_page?: number; page?: number }) {
  return useQuery({
    queryKey: websiteKeys.reservations(params),
    queryFn: () => websiteService.listReservations(params),
  });
}

export function useApproveWebReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => websiteService.approveReservation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.all }),
  });
}

export function useRejectWebReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      websiteService.rejectReservation(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.all }),
  });
}

export function useWebsiteVehicles(params?: { agency_id?: string; show_on_website?: boolean; per_page?: number }) {
  return useQuery({
    queryKey: websiteKeys.vehicles(params),
    queryFn: () => websiteService.listVehicles(params),
  });
}

export function useUpdateWebsiteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WebsiteVehicleUpdate }) =>
      websiteService.updateVehicle(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: websiteKeys.all }),
  });
}
