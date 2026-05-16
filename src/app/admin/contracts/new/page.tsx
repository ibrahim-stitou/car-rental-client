'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Loader2,
  Calendar
} from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { toast } from '@/components/ui/sonner';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { z } from 'zod';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {useLanguage} from '@/context/LanguageContext';
import { IconFileText } from '@tabler/icons-react';
import { UploadedFile } from '@/components/custom/singlefile-upload';
import { MultiFileUpload } from '@/components/custom/multifile-upload';

export default function CreateContractPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [consultants, setConsultants] = useState<{ id: number; fullname: string }[]>([]);
  const [consultantOpen, setConsultantOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [terminationDateOpen, setTerminationDateOpen] = useState(false);
  const [contractDocuments, setContractDocuments] = useState<UploadedFile[]>([]);

  // Contract form schema
  const contractFormSchema = z.object({
    consultant_id: z.string().min(1, t('admin.contracts.form.validation.consultantRequired')),
    reference: z.string().min(1, t('admin.contracts.form.validation.referenceRequired')),
    start_at: z.string().min(1, t('admin.contracts.form.validation.startDateRequired')),
    end_at: z.string().nullable(),
    status: z.string().min(1, t('admin.contracts.form.validation.statusRequired')),
    date_resiliation: z.string().nullable(),
    motif_resiliation: z.string().nullable(),
    contract_type: z.string().min(1, t('admin.contracts.form.validation.contractTypeRequired')),
    fees_amount: z.string().min(1, t('admin.contracts.form.validation.feesRequired')),
    management_fees: z.string().nullable().refine((value) => !value || (parseFloat(value) >= 0 && parseFloat(value) <= 100), {
      message: t('admin.contracts.form.validation.managementFeesRange'),
    }),
    assurance: z.string().nullable().transform(val => {
      if (val === '' || val === null) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }),
    tresieme_mois: z.string().nullable().transform(val => {
      if (val === '' || val === null) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }),
    cheque_repas: z.string().nullable().transform(val => {
      if (val === '' || val === null) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }),
    notes: z.string().nullable(),
    contract_document_paths: z.array(z.string()).optional().nullable(),
    // backward compat
    contract_document_path: z.string().nullable().optional(),
  });

  // Default form values
  const defaultContractFormValues = {
    consultant_id: "",
    reference: "",
    start_at: "",
    end_at: null,
    status: "in_progress",
    date_resiliation: null,
    motif_resiliation: null,
    contract_document_paths: [],
    contract_document_path: null,
    contract_type: "cdi",
    fees_amount: "0",
    management_fees: "0",
    notes: null,
    tresieme_mois: "0",
    assurance: "0",
    cheque_repas:"0"
  };

  const form = useForm<{
    consultant_id: string;
    reference: string;
    start_at: string;
    end_at: string | null;
    status: string;
    date_resiliation: string | null;
    motif_resiliation: string | null;
    contract_type: string;
    fees_amount: string;
    management_fees: string | null;
    assurance: any;
    tresieme_mois: any;
    cheque_repas: any;
    notes: string | null;
    contract_document_paths?: string[] | null;
    contract_document_path?: string | null;
  }>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: defaultContractFormValues,
    mode: 'onChange'
  });

  const fetchData = useCallback(async () => {
    try {
      const consultantsResponse = await apiClient.get(apiRoutes.common.consultantList);
      setConsultants(consultantsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      setSubmitError(t('admin.contracts.errors.loadConsultants'));
      toast.error(t('admin.contracts.errors.loadConsultants'));
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: typeof defaultContractFormValues) => {
    setIsLoading(true);
    setSubmitError('');

    try {
      await apiClient.post(apiRoutes.admin.contracts.create, data);
      toast.success(t('admin.contracts.create.success'));
      setTimeout(() => {
        router.push('/admin/contracts');
      }, 2000);
    } catch (error) {
      console.error('Error creating contract:', error);

      if (error instanceof Error && (error as any)?.response?.data?.errors) {
        const backendErrors = (error as any)?.response?.data?.errors;
        Object.keys(backendErrors).forEach((field) => {
          if (form.getFieldState(field as keyof typeof defaultContractFormValues)) {
            form.setError(field as keyof typeof defaultContractFormValues, {
              type: 'server',
              message: backendErrors[field][0]
            });
          } else {
            setSubmitError(
              (prev) =>
                `${prev ? prev + ', ' : ''}${field}: ${backendErrors[field][0]}`
            );
          }
        });
        toast.error(t('admin.contracts.errors.validation'));
      } else if (error instanceof Error) {
        setSubmitError(error.message || t('admin.contracts.errors.createFailed'));
        toast.error(
          error.message || t('admin.contracts.errors.generic')
        );
      } else {
        setSubmitError(t('admin.contracts.errors.unknown'));
        toast.error(t('admin.contracts.errors.unknown'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const contractType = form.watch('contract_type');
  useEffect(() => {
    if (contractType === 'cdi') {
      form.setValue('end_at', null);
    }
  }, [contractType, form]);

  return (
    <PageContainer>
      <div className='h-full w-full space-y-4 overflow-auto bg-gray-50 p-3'>
        <div className='flex items-start justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('admin.contracts.create.title')}
          </h1>
        </div>

        {submitError && (
          <Alert variant='destructive' className='border-red-400 bg-red-50'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          {/*@ts-ignore*/}
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-2'>
            <CardContent className='space-y-6 pt-4'>
              {/* Basic Contract Information */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>{t('admin.contracts.form.sections.basic')}</h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='reference'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.contracts.form.fields.reference')}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.contracts.form.placeholders.reference')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.contracts.form.fields.status')}*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder={t('admin.contracts.form.placeholders.status')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='planned'>{t('admin.contracts.status.pending')}</SelectItem>
                            <SelectItem value='in_progress'>
                              {t('admin.contracts.status.in_progress')}
                            </SelectItem>
                            <SelectItem value='terminated'>{t('admin.contracts.status.terminated')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='consultant_id'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.contracts.form.fields.consultant')}*</FormLabel>
                        <Popover open={consultantOpen} onOpenChange={setConsultantOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                role='combobox'
                                className={cn(
                                  'w-full justify-between',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value
                                  ? consultants.find(
                                    (consultant) =>
                                      consultant.id.toString() === field.value
                                  )?.fullname
                                  : t('admin.contracts.form.placeholders.consultant')}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-full p-0' align='start'>
                            <Command>
                              <CommandInput placeholder={t('admin.contracts.form.placeholders.searchConsultant')} />
                              <CommandEmpty>{t('admin.contracts.form.noResults.consultant')}</CommandEmpty>
                              <CommandGroup className='max-h-64 overflow-y-auto'>
                                {consultants.map((consultant) => (
                                  <CommandItem
                                    value={`${consultant.id}-${consultant.fullname}`}
                                    key={consultant.id}
                                    onSelect={() => {
                                      form.setValue(
                                        'consultant_id',
                                        consultant.id.toString()
                                      );
                                      setConsultantOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        consultant.id.toString() === field.value
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      )}
                                    />
                                    {consultant.fullname}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='contract_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.contracts.form.fields.contractType')}*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder={t('admin.contracts.form.placeholders.contractType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='cdi'>{t('admin.contracts.types.cdi')}</SelectItem>
                            <SelectItem value='cdd'>{t('admin.contracts.types.cdd')}</SelectItem>
                            <SelectItem value='freelance'>{t('admin.contracts.types.freelance')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='start_at'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.contracts.form.fields.startDate')}*</FormLabel>
                        <Popover
                          open={startDateOpen}
                          onOpenChange={setStartDateOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <Calendar className='mr-2 h-4 w-4' />
                                {field.value
                                  ? format(new Date(field.value), 'PPP')
                                  : t('admin.contracts.form.placeholders.selectDate')}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <CalendarComponent
                              mode='single'
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(date) => {
                                field.onChange(date?.toISOString() || "");
                                setStartDateOpen(false);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='end_at'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.contracts.form.fields.endDate')}</FormLabel>
                        <Popover
                          open={endDateOpen}
                          onOpenChange={setEndDateOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  (!field.value && 'text-muted-foreground'),
                                  (contractType === 'cdi' && 'bg-gray-100 cursor-not-allowed')
                                )}
                                disabled={contractType === 'cdi'}
                              >
                                <Calendar className='mr-2 h-4 w-4' />
                                {field.value
                                  ? format(new Date(field.value), 'PPP')
                                  : t('admin.contracts.form.placeholders.selectDate')}
                                {contractType === 'cdi' && t('admin.contracts.form.endDateNotApplicable')}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          {contractType !== 'cdi' && (
                            <PopoverContent className='w-auto p-0' align='start'>
                              <CalendarComponent
                                mode='single'
                                selected={
                                  field.value ? new Date(field.value) : undefined
                                }
                                onSelect={(date) => {
                                  field.onChange(date?.toISOString() || null);
                                  setEndDateOpen(false);
                                }}
                                initialFocus
                                disabled={(date) => {
                                  const startDate = form.getValues('start_at');
                                  return startDate
                                    ? date < new Date(startDate)
                                    : false;
                                }}
                              />
                            </PopoverContent>
                          )}
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Financial Information */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>{t('admin.contracts.form.sections.financial')}</h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='fees_amount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.contracts.form.fields.perdiem_amount')}*</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type='number'
                            step="0.01"
                            placeholder={t('admin.contracts.form.fields.perdiem_amount')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='management_fees'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.contracts.form.fields.managementFees')}</FormLabel>
                        <FormControl>
                          {/*@ts-ignore*/}
                          <Input
                            {...field}
                            type='number'
                            step="0.01"
                            placeholder={t('admin.contracts.form.fields.managementFees')}
                            min={0}
                            max={100}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.contracts.form.fields.insuranceMonths')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            placeholder={t('admin.contracts.form.fields.insuranceMonths')}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tresieme_mois"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.contracts.form.fields.thirteenthMonth') || 'Treizième mois'}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={t('admin.contracts.form.placeholders.thirteenthMonth') || 'Montant du 13ème mois'}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cheque_repas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.contracts.form.fields.cheque_repas') || 'Cheque repas'}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={t('admin.contracts.form.placeholders.cheque_repas') || 'Montant du 13ème mois'}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Termination Details (if applicable) */}
              {form.watch('status') === 'terminated' && (
                <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                  <h3 className='text-lg font-medium'>{t('admin.contracts.form.sections.termination')}</h3>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='date_resiliation'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel>{t('admin.contracts.form.fields.terminationDate')}</FormLabel>
                          <Popover
                            open={terminationDateOpen}
                            onOpenChange={setTerminationDateOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant='outline'
                                  className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  <Calendar className='mr-2 h-4 w-4' />
                                  {field.value
                                    ? format(new Date(field.value), 'PPP')
                                    : t('admin.contracts.form.placeholders.selectDate')}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0' align='start'>
                              <CalendarComponent
                                mode='single'
                                selected={
                                  field.value ? new Date(field.value) : undefined
                                }
                                onSelect={(date) => {
                                  field.onChange(date?.toISOString() || null);
                                  setTerminationDateOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='motif_resiliation'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.contracts.form.fields.terminationReason')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t('admin.contracts.form.placeholders.terminationReason')}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>
              )}

              {/* Notes & Contract Document Upload */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.contracts.form.fields.notes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t('admin.contracts.form.placeholders.notes')}
                          className="min-h-30 mb-0"
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contract_document_paths"
                  render={() => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <IconFileText className='h-4 w-4 text-primary' />
                        {t('admin.contracts.form.fields.document')}
                      </FormLabel>
                      <MultiFileUpload
                        label=""
                        value={contractDocuments}
                        onFilesChangeAction={(files) => {
                          setContractDocuments(files);
                          const paths = files.map((f) => f.path).filter(Boolean) as string[];
                          form.setValue('contract_document_paths', paths, {
                            shouldValidate: true
                          });
                        }}
                        description={t('admin.contracts.form.placeholders.documentDescription')}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxSize={5}
                        maxFiles={10}
                        disabled={isLoading}
                        collection="contract_documents"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </section>
            </CardContent>

            <CardFooter className='flex justify-between border-t pt-6'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isLoading ? t('admin.contracts.create.creating') : t('admin.contracts.create.submit')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}