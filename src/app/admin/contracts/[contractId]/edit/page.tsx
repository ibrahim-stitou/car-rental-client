'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IconFileText } from '@tabler/icons-react';
import { UploadedFile } from '@/components/custom/singlefile-upload';
import { MultiFileUpload } from '@/components/custom/multifile-upload';
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
import { useContractStore } from '@/stores/contract-store';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

const contractFormSchema = z.object({
  consultant_id: z.string().min(1, "Consultant is required"),
  reference: z.string().min(1, "Reference is required"),
  start_at: z.string().min(1, "Start date is required"),
  end_at: z.string().nullable(),
  status: z.string().min(1, "Status is required"),
  date_resiliation: z.string().nullable(),
  motif_resiliation: z.string().nullable(),
  contract_type: z.string().min(1, "Contract type is required"),
  fees_amount: z.string().min(1, "Fees amount is required"),
  contract_document_paths: z.array(z.string()).optional().nullable(),
  contract_document_path: z.string().nullable().optional(),
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
  management_fees: z.string().nullable().refine((value) => !value || (parseFloat(value) >= 0 && parseFloat(value) <= 100), {
    message: "Management fees must be between 0 and 100",
  }),
  notes: z.string().nullable(),
});

const emptyContractFormValues = {
  consultant_id: "",
  reference: "",
  start_at: "",
  end_at: null,
  status: "in_progress",
  date_resiliation: null,
  motif_resiliation: null,
  contract_type: "cdi",
  fees_amount: "0",
  management_fees: "0",
  notes: null,
  contract_document_paths: [],
  contract_document_path: null,
  assurance: "0",
  tresieme_mois: "0",
  cheque_repas:"0"
};

//@ts-ignore
const FormSectionSkeleton = ({ title, fields = 2 }) => (
  <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
    <h3 className='text-lg font-medium'>{title}</h3>
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      {Array(fields).fill(0).map((_, index) => (
        <div key={index} className='space-y-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-10 w-full' />
        </div>
      ))}
    </div>
  </section>
);

export default function EditContractPage({
                                           params
                                         }: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const { getContract, updateContract } = useContractStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consultants, setConsultants] = useState<{ id: number; fullname: string }[]>([]);
  const [consultantOpen, setConsultantOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [terminationDateOpen, setTerminationDateOpen] = useState(false);
  const [contractLoaded, setContractLoaded] = useState(false);
  const [contractDocuments, setContractDocuments] = useState<UploadedFile[]>([]);

  const form = useForm<typeof emptyContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: emptyContractFormValues,
    mode: 'onChange'
  });

  const loadContract = useCallback(async () => {
    if (!contractId) return;
    setIsLoading(true);
    try {
      const contract = await getContract(contractId);
      if (contract) {
        const contractData = contract.contract;
        if (!contractData) {
          throw new Error("Contract data is missing");
        }
        const formData = {
          consultant_id: contractData.consultant_id.toString(),
          reference: contractData.reference,
          start_at: contractData.start_at,
          end_at: contractData.end_at || null,
          status: contractData.status,
          date_resiliation: contractData.date_resiliation || null,
          motif_resiliation: contractData.motif_resiliation || null,
          contract_type: contractData.contract_type,
          fees_amount: contractData.fees_amount,
          management_fees: contractData.management_fees || "0",
          assurance: contractData.assurance || "0",
          tresieme_mois: contractData.tresieme_mois || "0",
          cheque_repas: contractData.cheque_repas || "0",
          notes: contractData.notes || null,
          contract_document_path: null,
        };

        // Set existing document if available
        if (Array.isArray(contractData.media) && contractData.media.length > 0) {
          const mapped: UploadedFile[] = contractData.media.map((m: any) => ({
            id: m.id,
            name: m.name || m.file_name,
            url: m.original_url,
            original_url: m.original_url,
            mime_type: m.mime_type,
            size: m.size,
            file_name: m.file_name,
            type: m.type,
            collection_name: m.collection_name,
            created_at: m.created_at,
            uploaded: true,
          }));
          setContractDocuments(mapped);
          // @ts-ignore
          form.setValue('contract_document_paths', mapped.map((x) => x.path || x.url).filter(Boolean));
        }
        //@ts-ignore
        form.reset(formData);
        setContractLoaded(true);
      } else {
        toast.error(t('admin.contracts.edit.notFound') || "Contract not found");
        router.push('/admin/contracts');
      }
    } catch (error) {
      console.error('Error loading contract:', error);
      toast.error(t('admin.contracts.edit.loadError') || 'Failed to load contract data');
    } finally {
      setIsLoading(false);
    }
  }, [contractId, getContract, form, router, t]);
  const fetchData = useCallback(async () => {
    try {
      const consultantsResponse = await apiClient.get(apiRoutes.common.consultantList);
      setConsultants(consultantsResponse.data.data || []);
      await loadContract();
    } catch (error) {
      console.error('Error fetching data:', error);
      setSubmitError(t('admin.contracts.edit.dataLoadError') || 'Failed to load data');
      toast.error(t('admin.contracts.edit.dataLoadError') || 'Failed to load data');
    }
  }, [loadContract, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: typeof emptyContractFormValues) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      //@ts-ignore
      const result = await updateContract(contractId, data);
      if (result) {
        toast.success(t('admin.contracts.edit.success') || 'Contract updated successfully');
        setTimeout(() => {
          router.push('/admin/contracts');
        }, 2000);
      } else {
        throw new Error(t('admin.contracts.edit.updateError') || 'Failed to update contract');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      if (error instanceof Error && (error as any)?.response?.data?.errors) {
        const backendErrors = (error as any)?.response?.data?.errors;
        Object.keys(backendErrors).forEach((field) => {
          if (
            form.getFieldState(field as keyof typeof emptyContractFormValues)
          ) {
            form.setError(field as keyof typeof emptyContractFormValues, {
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
        toast.error(t('admin.contracts.edit.validationError') || 'Validation error: Please check the form.');
      } else if (error instanceof Error) {
        setSubmitError(error.message || t('admin.contracts.edit.updateError') || 'Failed to update contract');
        toast.error(
          error.message || t('admin.contracts.edit.errorGeneric') || 'An error occurred while updating the contract'
        );
      } else {
        setSubmitError(t('admin.contracts.edit.unknownError') || 'An unknown error occurred');
        toast.error(t('admin.contracts.edit.unknownError') || 'An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className='h-full w-full space-y-4 overflow-auto bg-gray-50 p-3'>
          <div className='flex items-start justify-between'>
            <Skeleton className='h-8 w-32' />
          </div>

          <FormSectionSkeleton title={t('admin.contracts.form.contractInfoTitle') || "Contract Information"} fields={4} />
          <FormSectionSkeleton title={t('admin.contracts.form.financialDetailsTitle') || "Financial Details"} fields={3} />
          <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
            <h3 className='text-lg font-medium'>{t('admin.contracts.form.additionalInfoTitle') || "Additional Information"}</h3>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-32 w-full' />
          </section>

          <div className='flex justify-between border-t pt-6'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-10 w-32' />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='h-full w-full space-y-4 overflow-auto bg-gray-50 p-3'>
        <div className='flex items-start justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('admin.contracts.edit.title') || 'Edit Contract'}
          </h1>
        </div>

        {submitError && (
          <Alert variant='destructive' className='border-red-400 bg-red-50'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {contractLoaded && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-2'>
              <CardContent className='space-y-6 pt-4'>
                {/* Basic Contract Information */}
                <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                  <h3 className='text-lg font-medium'>{t('admin.contracts.form.contractInfoTitle') || 'Contract Information'}</h3>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='reference'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.contracts.form.reference') || 'Reference'}*</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t('admin.contracts.form.referencePlaceholder') || 'Contract Reference (e.g. CS_0001)'} />
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
                          <FormLabel>{t('admin.contracts.form.status') || 'Status'}*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder={t('admin.contracts.form.selectStatus') || 'Select status'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='pending'>{t('admin.contracts.status.pending') || 'Pending'}</SelectItem>
                              <SelectItem value='in_progress'>{t('admin.contracts.status.inProgress') || 'In Progress'}</SelectItem>
                              <SelectItem value='completed'>{t('admin.contracts.status.completed') || 'Completed'}</SelectItem>
                              <SelectItem value='terminated'>{t('admin.contracts.status.terminated') || 'Terminated'}</SelectItem>
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
                          <FormLabel>{t('admin.contracts.form.consultant') || 'Consultant'}*</FormLabel>
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
                                    : t('admin.contracts.form.selectConsultant') || 'Select consultant'}
                                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className='w-full p-0' align='start'>
                              <Command>
                                <CommandInput placeholder={t('admin.contracts.form.searchConsultant') || 'Search consultant...'} />
                                <CommandEmpty>{t('admin.contracts.form.noConsultantFound') || 'No consultant found.'}</CommandEmpty>
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
                          <FormLabel>{t('admin.contracts.form.contractType') || 'Contract Type'}*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder={t('admin.contracts.form.selectContractType') || 'Select contract type'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='cdi'>{t('admin.contracts.contractTypes.cdi') || 'CDI (Permanent)'}</SelectItem>
                              <SelectItem value='cdd'>{t('admin.contracts.contractTypes.cdd') || 'CDD (Fixed-term)'}</SelectItem>
                              <SelectItem value='freelance'>{t('admin.contracts.contractTypes.freelance') || 'Freelance'}</SelectItem>
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
                          <FormLabel>{t('admin.contracts.form.startDate') || 'Start Date'}*</FormLabel>
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
                                    : t('admin.contracts.form.selectDate') || 'Select date'}
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
                          <FormLabel>{t('admin.contracts.form.endDate') || 'End Date'}</FormLabel>
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
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  <Calendar className='mr-2 h-4 w-4' />
                                  {field.value
                                    ? format(new Date(field.value), 'PPP')
                                    : t('admin.contracts.form.selectDate') || 'Select date'}
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
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* Financial Information */}
                <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                  <h3 className='text-lg font-medium'>{t('admin.contracts.form.financialDetailsTitle') || 'Financial Details'}</h3>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='fees_amount'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.contracts.form.perdiem_amount') || 'Flat fees Amount'}*</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type='number'
                              step="0.01"
                              placeholder={t('admin.contracts.form.perdiem_amount') || 'Fees Amount'}
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
                          <FormLabel>{t('admin.contracts.form.managementFees') || 'Management Fees (%)'}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type='number'
                              step="0.01"
                              placeholder={t('admin.contracts.form.managementFeesPlaceholder') || 'Management Fees'}
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
                              placeholder={t('admin.contracts.form.placeholders.insuranceMonths')}
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
                          <FormLabel>{t('admin.contracts.form.fields.thirteenthMonth')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              placeholder={t('admin.contracts.form.placeholders.thirteenthMonth')}
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
                          <FormLabel>{t('admin.contracts.form.fields.cheque_repas')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              placeholder={t('admin.contracts.form.placeholders.cheque_repas')}
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
                    <h3 className='text-lg font-medium'>{t('admin.contracts.form.terminationDetailsTitle') || 'Termination Details'}</h3>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='date_resiliation'
                        render={({ field }) => (
                          <FormItem className='flex flex-col'>
                            <FormLabel>{t('admin.contracts.form.terminationDate') || 'Termination Date'}</FormLabel>
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
                                      : t('admin.contracts.form.selectDate') || 'Select date'}
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
                            <FormLabel>{t('admin.contracts.form.terminationReason') || 'Termination Reason'}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t('admin.contracts.form.terminationReasonPlaceholder') || 'Reason for termination'} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>
                )}

                {/* Notes & Document Section */}
                <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                  <h3 className='text-lg font-medium'>{t('admin.contracts.form.sections.additional') || 'Additional Information'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.contracts.form.fields.notes') || 'Notes'}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t('admin.contracts.form.placeholders.notes') || 'Additional notes about the contract'}
                              className="min-h-32 mb-8"
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
                            {t('admin.contracts.form.fields.document') || 'Contract Document'}
                          </FormLabel>
                          <MultiFileUpload
                            label=""
                            value={contractDocuments}
                            onFilesChangeAction={(files) => {
                              setContractDocuments(files);
                              // @ts-ignore
                              form.setValue('contract_document_paths', files.map((f) => f.path || f.url).filter(Boolean), { shouldValidate: true });}}
                            description={t('admin.contracts.form.placeholders.documentDescription') || 'Upload contract documents (PDF)'}
                            accept={{ "application/pdf": [".pdf"] }}
                            maxSize={5}
                            maxFiles={10}
                            disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  {isSubmitting ?
                    (t('admin.contracts.edit.updating') || 'Updating...') :
                    (t('admin.contracts.edit.submit') || 'Update Contract')}
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}
      </div>
    </PageContainer>
  );
}
