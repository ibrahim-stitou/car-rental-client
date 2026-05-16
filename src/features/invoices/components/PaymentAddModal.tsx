'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import paymentSchema from '@/schemas/paymentSchema';
import { z } from 'zod';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { useLanguage } from '@/context/LanguageContext';

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface Bank {
  id: number;
  name: string;
}

interface PaymentAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  totalHT: string;
  totalTTC: string;
  onPaymentAdded: () => void;
}

export function PaymentAddModal({
                                  open,
                                  onOpenChange,
                                  invoiceId,
                                  totalHT,
                                  totalTTC,
                                  onPaymentAdded,
                                }: PaymentAddModalProps) {
  const { t } = useLanguage();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noBanksAvailable, setNoBanksAvailable] = useState(false);

  // Create a dynamic schema based on bank availability
  const getDynamicSchema = () => {
    const baseSchema = paymentSchema;

    // If no banks are available, remove the bank_id validation
    if (noBanksAvailable) {
      return baseSchema.omit({ bank_id: true });
    }

    return baseSchema;
  };

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(getDynamicSchema()),
    defaultValues: {
      paymentMode: '',
      payDate: new Date(),
      bank_id: 0,
      amountHT: totalHT,
      amountTTC: totalTTC,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  // Fetch banks when modal opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setNoBanksAvailable(false); // Reset flag

      apiClient.get(apiRoutes.admin.banks.simpleList)
        .then(response => {
          if (response.data?.success) {
            const banksList = response.data.data;
            setBanks(banksList);

            // Set flag if no banks are available
            if (banksList.length === 0) {
              setNoBanksAvailable(true);
              form.setValue('bank_id', 0); // Set a default value
            }
          } else {
            toast.error(t('admin.invoices.payment.bankLoadError') || 'Failed to load banks');
            setNoBanksAvailable(true);
          }
        })
        .catch(error => {
          console.error('Error loading banks:', error);
          toast.error(t('admin.invoices.payment.bankLoadError') || 'Failed to load banks');
          setNoBanksAvailable(true);
        })
        .finally(() => {
          setIsLoading(false);
        });

      form.reset({
        paymentMode: '',
        payDate: new Date(),
        bank_id: 0,
        amountHT: totalHT,
        amountTTC: totalTTC,
      });
    }
  }, [open, form, totalHT, totalTTC, t]);

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      const formattedData = {
        invoice_id: invoiceId,
        mode: data.paymentMode,
        pay_date: format(data.payDate, 'yyyy-MM-dd'),
        bank_id: noBanksAvailable ? null : data.bank_id, // Send null if no banks
        amount_ht: data.amountHT,
        amount_ttc: data.amountTTC,
      };

      const response = await apiClient.post(
        apiRoutes.admin.payments.create,
        formattedData
      );

      if (response.data?.success) {
        toast.success(t('admin.invoices.payment.addSuccess') || 'Payment added successfully');
        onOpenChange(false);
        onPaymentAdded();
      } else {
        toast.error(response.data?.message || t('admin.invoices.payment.addError') || 'Failed to add payment');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(
        error.response?.data?.message ||
        t('admin.invoices.payment.errorGeneric') ||
        'An error occurred while adding the payment'
      );
    }
  };

  // Modify the bank field rendering in the return section
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t('admin.invoices.payment.title') || 'Add Payment'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Payment mode field remains unchanged */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMode" className="col-span-1">
                {t('admin.invoices.payment.mode') || 'Mode'}
              </Label>
              <Select
                onValueChange={(value) => form.setValue('paymentMode', value)}
                defaultValue={form.getValues('paymentMode')}
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder={t('admin.invoices.payment.selectMode') || 'Select payment mode'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">
                    {t('admin.invoices.payment.modes.cash') || 'Cash'}
                  </SelectItem>
                  <SelectItem value="cheque">
                    {t('admin.invoices.payment.modes.check') || 'Check'}
                  </SelectItem>
                  <SelectItem value="virement">
                    {t('admin.invoices.payment.modes.bankTransfer') || 'Bank Transfer'}
                  </SelectItem>
                  <SelectItem value="carte">
                    {t('admin.invoices.payment.modes.creditCard') || 'Credit Card'}
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.paymentMode && (
                <p className="col-span-4 text-xs text-red-500">
                  {form.formState.errors.paymentMode.message}
                </p>
              )}
            </div>

            {/* Payment date field remains unchanged */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payDate" className="col-span-1">
                {t('admin.invoices.payment.date') || 'Date'}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !form.getValues('payDate') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.getValues('payDate') ? (
                      format(form.getValues('payDate'), "PPP")
                    ) : (
                      <span>{t('admin.invoices.payment.selectDate') || 'Select date'}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('payDate')}
                    onSelect={(date) => date && form.setValue('payDate', date)}
                    initialFocus
                    fromYear={new Date().getFullYear() - 10}
                    toYear={new Date().getFullYear() + 10}
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.payDate && (
                <p className="col-span-4 text-xs text-red-500">
                  {form.formState.errors.payDate.message}
                </p>
              )}
            </div>

            {/* Modified bank field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bank_id" className="col-span-1">
                {t('admin.invoices.payment.bank') || 'Bank'}
              </Label>
              {noBanksAvailable ? (
                <div className="col-span-3 text-sm text-amber-500 flex items-center">
                  <span className="mr-2">⚠️</span>
                  {t('admin.invoices.payment.noBanksAvailable') || 'No banks available'}
                </div>
              ) : (
                <Select
                  onValueChange={(value) => form.setValue('bank_id', Number(value))}
                  defaultValue={form.getValues('bank_id')?.toString() || ''}
                >
                  <SelectTrigger className="col-span-3 w-full">
                    <SelectValue placeholder={t('admin.invoices.payment.selectBank') || 'Select bank'} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2">{t('common.loading') || 'Loading...'}</span>
                      </div>
                    ) : banks.length > 0 ? (
                      banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id.toString()}>
                          {bank.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        {t('admin.invoices.payment.noBanksFound') || 'No banks found'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {form.formState.errors.bank_id && (
                <p className="col-span-4 text-xs text-red-500">
                  {form.formState.errors.bank_id.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{t('admin.invoices.payment.processing') || 'Processing...'}</span>
                </div>
              ) : (
                t('admin.invoices.payment.submit') || 'Add Payment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}