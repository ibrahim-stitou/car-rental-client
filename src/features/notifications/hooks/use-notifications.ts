import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import type { NotificationFilters, SendNotificationInput } from '@/types/notification.types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters?: NotificationFilters) => [...notificationKeys.all, 'list', filters] as const,
  summary: () => [...notificationKeys.all, 'summary'] as const,
};

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({ queryKey: notificationKeys.list(filters), queryFn: () => notificationService.list(filters) });
}
export function useNotificationSummary() {
  return useQuery({ queryKey: notificationKeys.summary(), queryFn: () => notificationService.summary() });
}
export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: SendNotificationInput) => notificationService.send(input), onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }) });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => notificationService.markRead(id), onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }) });
}
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => notificationService.markAllRead(), onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }) });
}
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => notificationService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }) });
}
