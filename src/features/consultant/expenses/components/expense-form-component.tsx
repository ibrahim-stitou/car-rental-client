'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { useLanguage } from '@/context/LanguageContext';

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
import { IconCalendar } from '@tabler/icons-react';
import { SingleFileUpload, UploadedFile } from '@/components/custom/singlefile-upload';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Interface for category options
interface CategoryOption {
  id: number;
  title: string;
}

export const expenseFormSchema = (t: (key: string) => string) => z.object({
  category_id: z.coerce.number({
    required_error: t('consultant.expenses.form.errors.category_required'),
  }).min(1, t('consultant.expenses.form.errors.category_required')),
  description: z.string().min(1, t('consultant.expenses.form.errors.description_required')),
  amount: z.coerce.number({
    required_error: t('consultant.expenses.form.errors.amount_required'),
  }).min(0.01, t('consultant.expenses.form.errors.amount_positive')),
  date: z.date({
    required_error: t('consultant.expenses.form.errors.date_required'),
  }),
  receipt_path: z.string({
    required_error: t('consultant.expenses.form.errors.receipt_required'),
  }).min(1, t('consultant.expenses.form.errors.receipt_required')),
});

export type ExpenseFormValues = z.infer<ReturnType<typeof expenseFormSchema>>;

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormValues) => Promise<void>;
  onCancelEdit?: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
  defaultValues?: ExpenseFormValues;
  categoryOptions: CategoryOption[];
  dateFilter?: (date: Date) => boolean;
  supportingDocument: UploadedFile | null;
  onFileChange: (file: UploadedFile | null) => void;
}

export default function ExpenseForm({
                                      onSubmit,
                                      onCancelEdit,
                                      isSubmitting,
                                      isEditing,
                                      defaultValues,
                                      categoryOptions,
                                      dateFilter,
                                      supportingDocument,
                                      onFileChange
                                    }: ExpenseFormProps) {
  const { t } = useLanguage();

  const expenseForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema(t)),
    defaultValues: defaultValues || {
      category_id: undefined,
      description: '',
      amount: undefined,
      date: new Date(),
      receipt_path: '',
    },
  });

  useEffect(() => {
    if (defaultValues && isEditing) {
      expenseForm.reset(defaultValues);
    }
  }, [defaultValues?.amount , defaultValues?.date , defaultValues?.category_id , defaultValues?.description]);

  useEffect(() => {
    expenseForm.reset(defaultValues);
  }, [isEditing]);

  useEffect(() => {
    if (supportingDocument?.path) {
      expenseForm.setValue('receipt_path', supportingDocument.path, { shouldValidate: true });
    }
  }, [supportingDocument]);

  const handleFormSubmit = async (data: ExpenseFormValues) => {
    await onSubmit(data);
    expenseForm.reset();
  };

  return (
    <Form {...expenseForm}>
      <form onSubmit={expenseForm.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={expenseForm.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('consultant.expenses.form.category')}</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ""}
                      >
                        <option value="">{t('consultant.expenses.form.select_category')}</option>
                        {categoryOptions.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.title}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount Field */}
              <FormField
                control={expenseForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('consultant.expenses.form.amount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Description Field */}
              <FormField
                control={expenseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('consultant.expenses.form.description')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('consultant.expenses.form.description_placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Field with DatePicker */}
              <FormField
                control={expenseForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('consultant.expenses.form.date')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal flex justify-between"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t('consultant.expenses.form.select_date')}</span>
                            )}
                            <IconCalendar className="h-4 w-4" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          defaultMonth={field.value}
                          fromMonth={new Date(field.value.getFullYear(), field.value.getMonth())}
                          toMonth={new Date(field.value.getFullYear(), field.value.getMonth())}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Right Section - Receipt Upload */}
          <div>
            <FormField
              control={expenseForm.control}
              name="receipt_path"
              render={({ field }) => (
                <FormItem className="h-full">
                  <FormLabel>{t('consultant.expenses.form.receipt')}</FormLabel>
                  <FormControl>
                    <SingleFileUpload
                      label=""
                      onFileChange={(file) => {
                        onFileChange(file);
                        field.onChange(file?.path || '');
                      }}
                      value={supportingDocument}
                      description={t('consultant.expenses.form.receipt_description')}
                      accept={{
                        "application/pdf": [".pdf"],
                        "image/jpeg": [".jpg", ".jpeg"],
                        "image/png": [".png"]
                      }}
                      maxSize={5}
                      previewHeight="h-30"
                      disabled={isSubmitting}
                      collection="expense_receipts"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {isEditing && onCancelEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancelEdit}
            >
              {t('consultant.expenses.form.cancel_edit')}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="flex gap-1">
                  <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-1 w-1 rounded-full bg-white animate-bounce"></div>
                </div>
                <span className="ml-2">
                  {isEditing ? t('consultant.expenses.form.updating') : t('consultant.expenses.form.adding')}
                </span>
              </>
            ) : (
              isEditing ? t('consultant.expenses.form.update_expense') : t('consultant.expenses.form.add_expense')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}