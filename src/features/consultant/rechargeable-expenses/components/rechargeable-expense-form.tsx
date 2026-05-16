'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { IconCalendar, IconClock, IconCoin, IconPencil, IconPlus, IconReceipt } from '@tabler/icons-react';
import { useLanguage } from '@/context/LanguageContext';

const rechargeableExpenseFormSchema = z.object({
  date: z.date({
    required_error: 'Date is required',
  }),
  nature: z.string().min(1, 'Nature is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  commentaire: z.string().optional(),
});

export type RechargeableExpenseLineFormValues = z.infer<typeof rechargeableExpenseFormSchema>;

interface RechargeableExpenseFormProps {
  onSubmit: (data: Omit<RechargeableExpenseLineFormValues, 'date'> & { date: string }) => Promise<void>;
  onCancelEdit?: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  defaultValues?: any;
  month?: number;
  year?: string;
}

export default function RechargeableExpensesForm({
                                                   onSubmit,
                                                   onCancelEdit,
                                                   isSubmitting = false,
                                                   isEditing = false,
                                                   defaultValues,
                                                   month,
                                                   year,
                                                 }: RechargeableExpenseFormProps) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(isSubmitting);

  const getDefaultDate = () => {
    if (defaultValues?.date) {
      return new Date(defaultValues.date);
    }
    if (month && year) {
      const currentDate = new Date();
      return new Date(parseInt(year), month - 1, Math.min(currentDate.getDate(), 15));
    }
    return new Date();
  };

  const form = useForm<RechargeableExpenseLineFormValues>({
    resolver: zodResolver(rechargeableExpenseFormSchema),
    defaultValues: {
      date: getDefaultDate(),
      nature: defaultValues?.nature || '',
      amount: defaultValues?.amount ? parseFloat(defaultValues.amount) : 0,
      commentaire: defaultValues?.commentaire || '',
    },
  });


  useEffect(() => {
    if (defaultValues) {
      form.reset({
        date: defaultValues.date ? new Date(defaultValues.date) : getDefaultDate(),
        nature: defaultValues.nature || '',
        amount: defaultValues.amount ? parseFloat(defaultValues.amount) : 0,
        commentaire: defaultValues.commentaire || '',
      });
    }
  }, [defaultValues, form]);

  const isDateInValidRange = (date: Date) => {
    if (!month || !year) return true;
    const targetMonth = month - 1;
    const targetYear = parseInt(year);
    return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
  };

  const handleSubmit = async (data: RechargeableExpenseLineFormValues) => {
    setSubmitting(true);
    try {
      const formattedData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
      };
      await onSubmit(formattedData);
      form.reset({
        date: getDefaultDate(),
        nature: '',
        amount: 0,
        commentaire: '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset({
      date: getDefaultDate(),
      nature: '',
      amount: 0,
      commentaire: '',
    });
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <Card className="bg-white border-primary/20">
      <CardHeader className="pb-2 pt-1">
        <CardTitle className="flex items-center gap-2 text-md font-bold">
          <IconReceipt className="h-4 w-4 text-primary" />
          <h1>    {isEditing
            ? t('consultant.rechargeable_expense.form.title_edit')
            : t('consultant.rechargeable_expense.form.title_add')}</h1>

        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-wrap items-end gap-4">
            {/* Date Field */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="min-w-55">
                  <FormLabel className="text-xs">{t('consultant.rechargeable_expense.form.date_label')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full h-8 pl-2 text-left text-xs font-normal flex justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PP')
                          ) : (
                            <span>{t('consultant.rechargeable_expense.form.date_placeholder')}</span>
                          )}
                          <IconCalendar className="ml-auto h-3 w-3 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          return month && year ? !isDateInValidRange(date) : false;
                        }}
                        initialFocus
                        month={field.value}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Amount Field */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="min-w-55">
                  <FormLabel className="text-xs">{t('consultant.rechargeable_expense.form.amount_label')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t('consultant.rechargeable_expense.form.amount_placeholder')}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="pl-6 h-8 text-xs"
                      />
                      <IconCoin className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Nature Field */}
            <FormField
              control={form.control}
              name="nature"
              render={({ field }) => (
                <FormItem className="min-w-55">
                  <FormLabel className="text-xs">{t('consultant.rechargeable_expense.form.nature_label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('consultant.rechargeable_expense.form.nature_placeholder')}
                      {...field}
                      className="h-8 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Comment Field */}
            <FormField
              control={form.control}
              name="commentaire"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-55">
                  <FormLabel className="text-xs">{t('consultant.rechargeable_expense.form.comment_label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('consultant.rechargeable_expense.form.comment_placeholder')}
                      className="h-8 min-h-8 resize-none py-1 text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex gap-1">
              {isEditing && onCancelEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="h-8 text-xs px-2 min-w-45"
                >
                  {t('consultant.rechargeable_expense.form.button_cancel')}
                </Button>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="h-8 text-xs px-2 min-w-45 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <IconClock className="h-3 w-3" />
                    {t('consultant.rechargeable_expense.form.button_saving')}
                  </>
                ) : isEditing ? (
                  <>
                    <IconPencil className="h-3 w-3" />
                    {t('consultant.rechargeable_expense.form.button_update')}
                  </>
                ) : (
                  <>
                    <IconPlus className="h-3 w-3" />
                    {t('consultant.rechargeable_expense.form.button_add')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}