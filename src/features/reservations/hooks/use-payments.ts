import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import type { CreatePaymentInput } from '@/types/payment.types';

export const paymentKeys = {
  all: ['payments'] as const,
  list: (reservationId: string) => [...paymentKeys.all, 'list', reservationId] as const,
};

export function useReservationPayments(reservationId: string) {
  return useQuery({
    queryKey: paymentKeys.list(reservationId),
    queryFn: () => paymentService.list(reservationId),
    enabled: !!reservationId,
  });
}

export function useAddPayment(reservationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => paymentService.create(reservationId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.list(reservationId) });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useDeletePayment(reservationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => paymentService.delete(reservationId, paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.list(reservationId) });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}
