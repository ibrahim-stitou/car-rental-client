'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {useLanguage} from '@/context/LanguageContext';
import { IconCash, IconCircleCheck, IconFileText } from '@tabler/icons-react';

interface Payment {
  bank: string;
  pay_date: string;
  mode: string;
  amount_ht: string;
  amount_ttc: string;
}

interface PaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
  invoiceReference: string;
  onViewInvoice: () => void;
}

export function PaymentDetailsModal({
                                      open,
                                      onOpenChange,
                                      payments,
                                      invoiceReference,
                                      onViewInvoice,
                                    }: PaymentDetailsModalProps) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <IconCash className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {t('admin.invoices.payment.details.receipt')}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {t('admin.invoices.payment.details.invoice')} #{invoiceReference}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {payments?.map((payment, index) => (
            <div key={index} className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-blue-50/50 p-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-blue-100 p-1.5 text-blue-600">
                    <IconCircleCheck className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-blue-700">
                    {t('admin.invoices.payment.details.payment')}#{index + 1}
                  </span>
                </div>
                <Badge className="bg-green-100 px-2 py-1 text-xs text-green-800">
                  {t('admin.invoices.payment.details.completed')}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="mb-1 text-sm text-gray-500">{t('admin.invoices.payment.details.paymentDate')}</div>
                  <div className="font-medium text-gray-800">
                    {format(new Date(payment.pay_date), 'PPP')}
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="mb-1 text-sm text-gray-500">{t('admin.invoices.payment.details.paymentMethod')}</div>
                  <div className="font-medium text-gray-800 capitalize">
                    {payment.mode}
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="mb-1 text-sm text-gray-500">{t('admin.invoices.payment.details.amountHT')}</div>
                  <div className="font-medium text-gray-800">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(parseFloat(payment.amount_ht))}
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="mb-1 text-sm text-gray-500">{t('admin.invoices.payment.details.amountTTC')}</div>
                  <div className="font-medium text-blue-600">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(parseFloat(payment.amount_ttc))}
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="mb-1 text-sm text-gray-500">{t('admin.invoices.payment.details.bank')}</div>
                <div className="font-medium text-gray-800">
                  {/*//@ts-ignore*/}
                  {payment.bank.name || 'N/A'}
                </div>
              </div>

              {index < payments.length - 1 && (
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-sm text-gray-500">
                      {t('admin.invoices.payment.details.additionalPayment')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onViewInvoice();
            }}
            variant="secondary"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <IconFileText className="mr-2 h-4 w-4" />
            {t('admin.invoices.payment.details.viewInvoice')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}