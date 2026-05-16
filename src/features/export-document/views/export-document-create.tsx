'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { useLanguage } from '@/context/LanguageContext';
import { useForm } from 'react-hook-form';
import { CardContent, CardFooter } from '@/components/ui/card';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
const ExportDocumentCreate = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const schema = z.object({
    document_type: z.string().nonempty(t('admin.exportDocuments.errors.documentTypeRequired')),
    month: z.string().nonempty(t('admin.exportDocuments.errors.monthRequired')),
    year: z.string().nonempty(t('admin.exportDocuments.errors.yearRequired')),
    paid: z.boolean().optional().default(false)
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      document_type: '',
      month: '',
      year: new Date().getFullYear().toString(),
      paid: false
    }
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (submitting) return;

    setSubmitting(true);

    apiClient.post(apiRoutes.admin.documentsExports.create, data)
      .then(response => {
        toast.success(response.data.message || t('admin.exportDocuments.success.generated'));
        router.push('/admin/export-documents');
      })
      .catch(error => {
        if (error.response?.data?.errors) {
          Object.keys(error.response.data.errors).forEach(key => {
            form.setError(key as any, {
              type: 'server',
              message: error.response.data.errors[key][0]
            });
          });
        } else {
          toast.error(error.response?.data?.message || t('admin.exportDocuments.errors.generateFailed'));
        }
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <PageContainer>
      <div className="h-full w-full space-y-4 overflow-auto bg-gray-50 p-3 md:p-6">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <Heading
            title={t('admin.exportDocuments.generate.title')}
            description={t('admin.exportDocuments.generate.description')}
          />
        </div>
        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CardContent className="space-y-4 pt-4">
              <section className="space-y-4 rounded-md border bg-white p-4 shadow-sm sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="document_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required="true">
                          {t('admin.exportDocuments.generate.documentType')}
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t('admin.exportDocuments.generate.selectDocumentType')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="subcontractor_invoices">
                                {t('admin.exportDocuments.documentTypes.subcontractor_invoices')}
                              </SelectItem>
                              <SelectItem value="salaries">
                                {t('admin.exportDocuments.documentTypes.salaries')}
                              </SelectItem>
                              <SelectItem value="expenses">
                                {t('admin.exportDocuments.documentTypes.expenses')}
                              </SelectItem>
                              <SelectItem value="mileage_expenses">
                                {t('admin.exportDocuments.documentTypes.mileage_expenses')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required="true">
                          {t('admin.exportDocuments.generate.month')}
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t('admin.exportDocuments.generate.selectMonth')} />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                                  {t(`common.months.${i + 1}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required="true">
                          {t('admin.exportDocuments.generate.year')}
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t('admin.exportDocuments.generate.selectYear')} />
                            </SelectTrigger>
                            <SelectContent>
                              {yearOptions.map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="paid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          {t('admin.exportDocuments.table.paid')}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </section>
            </CardContent>

            <CardFooter className="flex flex-col-reverse justify-between gap-2 border-t pt-6 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={submitting}
              >
                {submitting ? t('admin.exportDocuments.generate.generating') : t('admin.exportDocuments.generate.submit')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
};

export default ExportDocumentCreate;