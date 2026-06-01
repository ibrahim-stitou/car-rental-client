import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse } from '@/types/api.types';
import type { PaymentSummary, CreatePaymentInput } from '@/types/payment.types';

export const paymentService = {
  list: (reservationId: string) =>
    apiClient.get<ApiResponse<PaymentSummary>>(apiRoutes.payments.list(reservationId)).then((r) => r.data),

  create: (reservationId: string, input: CreatePaymentInput) =>
    apiClient.post<ApiResponse<PaymentSummary>>(apiRoutes.payments.create(reservationId), input).then((r) => r.data),

  delete: (reservationId: string, paymentId: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.payments.delete(reservationId, paymentId)).then((r) => r.data),
};
