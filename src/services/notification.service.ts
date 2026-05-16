import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Notification, NotificationSummary, SendNotificationInput, NotificationFilters } from '@/types/notification.types';

export const notificationService = {
  list: (filters?: NotificationFilters) =>
    apiClient.get<PaginatedResponse<Notification>>(apiRoutes.notifications.list, { params: filters }).then((r) => r.data),
  send: (input: SendNotificationInput) =>
    apiClient.post<ApiResponse<Notification>>(apiRoutes.notifications.send, input).then((r) => r.data),
  markRead: (id: string) =>
    apiClient.post<ApiResponse<null>>(apiRoutes.notifications.markRead(id)).then((r) => r.data),
  markAllRead: () =>
    apiClient.post<ApiResponse<null>>(apiRoutes.notifications.markAllRead).then((r) => r.data),
  summary: () =>
    apiClient.get<ApiResponse<NotificationSummary>>(apiRoutes.notifications.summary).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.notifications.delete(id)).then((r) => r.data),
};
