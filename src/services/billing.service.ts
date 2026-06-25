import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { BillingDocument, BillingHistoryEntry, CreateBillingInput, UpdateBillingInput, MarkBillingPaidInput, BillingFilters, BillingStatistics } from '@/types/billing.types';

export const billingService = {
  list: (filters?: BillingFilters) =>
    apiClient.get<PaginatedResponse<BillingDocument>>(apiRoutes.billing.list, { params: filters }).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<BillingDocument>>(apiRoutes.billing.show(id)).then((r) => r.data),
  create: (input: CreateBillingInput) =>
    apiClient.post<ApiResponse<BillingDocument>>(apiRoutes.billing.create, input).then((r) => r.data),
  update: (id: string, input: UpdateBillingInput) =>
    apiClient.put<ApiResponse<BillingDocument>>(apiRoutes.billing.update(id), input).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.billing.delete(id)).then((r) => r.data),
  markPaid: (id: string, input: MarkBillingPaidInput) =>
    apiClient.post<ApiResponse<BillingDocument>>(apiRoutes.billing.markPaid(id), input).then((r) => r.data),
  approve: (id: string) =>
    apiClient.post<ApiResponse<BillingDocument>>(apiRoutes.billingExt.approve(id)).then((r) => r.data),
  unapprove: (id: string, reason: string) =>
    apiClient.post<ApiResponse<BillingDocument>>(apiRoutes.billing.unapprove(id), { reason }).then((r) => r.data),
  history: (id: string) =>
    apiClient.get<ApiResponse<BillingHistoryEntry[]>>(apiRoutes.billing.history(id)).then((r) => r.data),
  createFromReservation: (reservationId: string, type: string = 'FA') =>
    apiClient.post<ApiResponse<BillingDocument>>(apiRoutes.billingExt.fromReservation(reservationId), { type }).then((r) => r.data),
  viewPdf: (id: string) => `${apiRoutes.billingExt.viewPdf(id)}`,
  downloadPdf: (id: string) => `${apiRoutes.billingExt.downloadPdf(id)}`,
  statistics: () =>
    apiClient.get<ApiResponse<BillingStatistics>>(apiRoutes.billing.statistics).then((r) => r.data),
};
