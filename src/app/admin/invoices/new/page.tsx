'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/sonner';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { format } from 'date-fns';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@/components/ui/command';
import { Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/context/LanguageContext';
import { SingleFileUpload, UploadedFile } from '@/components/custom/singlefile-upload';

interface Mission {
  id: number;
  title: string;
}

interface ClientConsultantData {
  client_id: number;
  client_name: string;
  consultant_id: number;
  consultant_name: string;
}

const invoiceSchema = z.object({
  mission_id: z.number({
    required_error: 'Please select a mission'
  }),
  client_id: z.number({
    required_error: 'Client is required'
  }),
  consultant_id: z.number({
    required_error: 'Consultant is required'
  }),
  objet: z.string().min(1, 'Object is required'),
  date: z.date({
    required_error: 'Date is required'
  }),
  date_echenace: z.date({
    required_error: 'Due date is required'
  }),
  justificatif: z.string().nullable().optional(),
});

type InvoiceValues = z.infer<typeof invoiceSchema>;

export default function NewInvoice() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);
  const [isLoadingClientConsultant, setIsLoadingClientConsultant] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [consultantName, setConsultantName] = useState<string>('');
  const [justificatifFile, setJustificatifFile] = useState<UploadedFile | null>(null);

  const form = useForm<InvoiceValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      mission_id: undefined,
      client_id: undefined,
      consultant_id: undefined,
      objet: '',
      date: new Date(),
      date_echenace: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      justificatif: null,
    }
  });

  useEffect(() => {
    const fetchMissions = async () => {
      setIsLoadingMissions(true);
      try {
        const response = await apiClient.get(apiRoutes.admin.missions.simpleList);
        if (response.data?.success && Array.isArray(response.data.data)) {
          setMissions(response.data.data);
        } else {
          setMissions([]);
          toast.error(t('admin.invoices.errorLoadingMissions') || 'Failed to load missions data');
        }
      } catch (error) {
        console.error('Failed to load missions:', error);
        toast.error(t('admin.invoices.errorLoadingMissions') || 'Failed to load missions');
        setMissions([]);
      } finally {
        setIsLoadingMissions(false);
      }
    };

    fetchMissions();
  }, [t]);

  useEffect(() => {
    if (Object.keys(apiErrors).length > 0) {
      Object.entries(apiErrors).forEach(([field, errors]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof InvoiceValues, {
            type: 'server',
            message: errors[0]
          });
        }
      });
    }
  }, [apiErrors, form]);

  const fetchClientAndConsultant = async (missionId: number) => {
    setIsLoadingClientConsultant(true);
    try {
      const response = await apiClient.get(apiRoutes.admin.invoices.getConsultantClient(missionId));
      if (response.data?.success && response.data.data) {
        const { client_id, client_name, consultant_id, consultant_name } = response.data.data as ClientConsultantData;

        form.setValue('client_id', client_id);
        form.setValue('consultant_id', consultant_id);
        setClientName(client_name);
        setConsultantName(consultant_name);

        if (apiErrors.client_id) {
          const newErrors = { ...apiErrors };
          delete newErrors.client_id;
          setApiErrors(newErrors);
        }
        if (apiErrors.consultant_id) {
          const newErrors = { ...apiErrors };
          delete newErrors.consultant_id;
          setApiErrors(newErrors);
        }
      } else {
        toast.error(t('admin.invoices.errorLoadingClientConsultant') || 'Failed to load client and consultant data');
      }
    } catch (error) {
      console.error('Failed to load client and consultant:', error);
      toast.error(t('admin.invoices.errorLoadingClientConsultant') || 'Failed to load client and consultant data');
    } finally {
      setIsLoadingClientConsultant(false);
    }
  };

  const selectedMissionId = form.watch('mission_id');
  useEffect(() => {
    if (selectedMissionId) {
      fetchClientAndConsultant(selectedMissionId);
    }
  }, [selectedMissionId]);

  const onSubmit = async (data: InvoiceValues) => {
    setApiErrors({});
    setGeneralError(null);
    setIsSubmitting(true);
    try {
      const formattedData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
        date_echenace: format(data.date_echenace, 'yyyy-MM-dd'),
        justificatif: data.justificatif || null,
      };

      const response = await apiClient.post(
        apiRoutes.admin.invoices.create,
        formattedData
      );

      if (response.data?.success) {
        toast.success(response.data?.message || t('admin.invoices.create.success') || 'Invoice created successfully');
        const newInvoiceId = response.data.data.id;
        router.push(`/admin/invoices/${newInvoiceId}`);
      } else {
        toast.error(response.data?.message || t('admin.invoices.create.error') || 'Failed to create invoice');
        setGeneralError(response.data?.message || t('admin.invoices.create.error') || 'Failed to create invoice');
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      if (error.response?.data?.errors) {
        setApiErrors(error.response.data.errors);
        const firstField = Object.keys(error.response.data.errors)[0];
        const firstError = error.response.data.errors[firstField][0];
        toast.error(`${firstField}: ${firstError}`);
      } else if (error.response?.data?.message) {
        setGeneralError(error.response.data.message);
        toast.error(error.response.data.message);
      } else {
        setGeneralError(t('admin.invoices.create.errorGeneric') || 'An error occurred while creating the invoice');
        toast.error(t('admin.invoices.create.errorGeneric') || 'An error occurred while creating the invoice');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMissionById = (id: number) => missions.find(mission => mission.id === id)?.title;

  return (
    <PageContainer>
      <div className='mx-auto w-full space-y-4'>
        <div className='flex items-center justify-between'>
          <Heading
            title={t('admin.invoices.create.title') || 'Create New Invoice'}
            description={t('admin.invoices.create.description') || 'Fill in the details to create a new invoice'}
          />
          <Button
            variant='outline'
            onClick={() => router.push('/admin/invoices')}
            className='h-8'
            size='sm'
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
        </div>
        <Separator />

        {generalError && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className='pt-6'>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                {/* Object field - full width */}
                <FormField
                  control={form.control}
                  name='objet'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.invoices.form.object') || 'Object'}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('admin.invoices.form.objectPlaceholder') || 'Prestations de développement'}
                          {...field}
                          className={cn(
                            apiErrors.objet &&
                            'border-red-500 focus-visible:ring-red-500'
                          )}
                        />
                      </FormControl>
                      <FormMessage>
                        {apiErrors.objet ? apiErrors.objet[0] : null}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                {/* Mission, Client, Consultant - in one row */}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  {/* Mission selection */}
                  <FormField
                    control={form.control}
                    name='mission_id'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.invoices.form.mission') || 'Mission'}</FormLabel>
                        <Popover open={missionOpen} onOpenChange={setMissionOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                role='combobox'
                                aria-expanded={missionOpen}
                                className={cn(
                                  'w-full justify-between',
                                  !field.value && 'text-muted-foreground',
                                  apiErrors.mission_id &&
                                  'border-red-500 ring-1 ring-red-500'
                                )}
                              >
                                {field.value
                                  ? getMissionById(field.value)
                                  : t('admin.invoices.form.selectMission') || 'Select mission'}
                                <span className='ml-2 opacity-50'>▼</span>
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-[300px] p-0'>
                            <Command>
                              <CommandInput
                                placeholder={t('admin.invoices.form.searchMission') || 'Search mission...'}
                                className='h-9'
                              />
                              <CommandEmpty>{t('admin.invoices.form.noMissionFound') || 'No mission found.'}</CommandEmpty>
                              <CommandGroup className='max-h-[200px] overflow-auto'>
                                {isLoadingMissions ? (
                                  <div className='flex items-center justify-center py-6'>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    <span>{t('admin.invoices.loadingMissions') || 'Loading missions...'}</span>
                                  </div>
                                ) : (
                                  missions.map((mission) => (
                                    <CommandItem
                                      key={mission.id}
                                      value={`${mission.id}-${mission.title}`}
                                      onSelect={() => {
                                        form.setValue('mission_id', mission.id);
                                        setMissionOpen(false);
                                        if (apiErrors.mission_id) {
                                          const newErrors = { ...apiErrors };
                                          delete newErrors.mission_id;
                                          setApiErrors(newErrors);
                                        }
                                      }}
                                    >
                                      {mission.title}
                                      <Check
                                        className={cn(
                                          'ml-auto h-4 w-4',
                                          mission.id === field.value
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                        )}
                                      />
                                    </CommandItem>
                                  ))
                                )}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage>
                          {apiErrors.mission_id ? apiErrors.mission_id[0] : null}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  {/* Client - Disabled and read-only */}
                  <FormField
                    control={form.control}
                    name='client_id'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.invoices.form.client') || 'Client'}</FormLabel>
                        <FormControl>
                          <Input
                            readOnly
                            disabled
                            value={clientName || (field.value ? `${t('admin.invoices.form.clientId') || 'Client ID'}: ${field.value}` : '')}
                            placeholder={t('admin.invoices.form.clientAutoFill') || "Will be auto-filled"}
                            className={cn(
                              'bg-muted/50',
                              apiErrors.client_id && 'border-red-500 focus-visible:ring-red-500'
                            )}
                          />
                        </FormControl>
                        <FormMessage>
                          {apiErrors.client_id ? apiErrors.client_id[0] : null}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  {/* Consultant - Disabled and read-only */}
                  <FormField
                    control={form.control}
                    name='consultant_id'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.invoices.form.consultant') || 'Consultant'}</FormLabel>
                        <FormControl>
                          <Input
                            readOnly
                            disabled
                            value={consultantName || (field.value ? `${t('admin.invoices.form.consultantId') || 'Consultant ID'}: ${field.value}` : '')}
                            placeholder={t('admin.invoices.form.consultantAutoFill') || "Will be auto-filled"}
                            className={cn(
                              'bg-muted/50',
                              apiErrors.consultant_id && 'border-red-500 focus-visible:ring-red-500'
                            )}
                          />
                        </FormControl>
                        <FormMessage>
                          {apiErrors.consultant_id ? apiErrors.consultant_id[0] : null}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dates - in one row */}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  {/* Invoice Date */}
                  <FormField
                    control={form.control}
                    name='date'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.invoices.form.date') || 'Invoice Date'}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground',
                                  apiErrors.date &&
                                  'border-red-500 ring-1 ring-red-500'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>{t('admin.invoices.form.pickDate') || 'Pick a date'}</span>
                                )}
                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                if (apiErrors.date) {
                                  const newErrors = { ...apiErrors };
                                  delete newErrors.date;
                                  setApiErrors(newErrors);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage>
                          {apiErrors.date ? apiErrors.date[0] : null}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  {/* Due Date */}
                  <FormField
                    control={form.control}
                    name='date_echenace'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.invoices.form.dueDate') || 'Due Date'}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground',
                                  apiErrors.date_echenace &&
                                  'border-red-500 ring-1 ring-red-500'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>{t('admin.invoices.form.pickDate') || 'Pick a date'}</span>
                                )}
                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                if (apiErrors.date_echenace) {
                                  const newErrors = { ...apiErrors };
                                  delete newErrors.date_echenace;
                                  setApiErrors(newErrors);
                                }
                              }}
                              initialFocus
                              disabled={(date) => {
                                const invoiceDate = form.getValues('date');
                                return date < invoiceDate;
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage>
                          {apiErrors.date_echenace
                            ? apiErrors.date_echenace[0]
                            : null}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Justificatif upload */}
                <FormField
                  control={form.control}
                  name='justificatif'
                  render={() => (
                    <FormItem>
                      <SingleFileUpload
                        label={t('admin.invoices.form.justificatifLabel') || ''}
                        onFileChange={(file) => {
                          setJustificatifFile(file);
                          form.setValue('justificatif', file?.path || null);
                        }}
                        value={justificatifFile}
                        description={t('admin.invoices.form.justificatifDescription') || 'Upload a supporting document (PDF, optional)'}
                        accept={{ 'application/pdf': ['.pdf'] }}
                        maxSize={5}
                        previewHeight='h-40'
                        disabled={isSubmitting}
                        collection='invoice_justificatifs'
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end'>
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='w-full md:w-auto'
                  >
                    {isSubmitting ? (
                      <div className='flex items-center'>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        <span>{t('admin.invoices.create.creating') || 'Creating...'}</span>
                      </div>
                    ) : (
                      t('admin.invoices.create.submit') || 'Create Invoice'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}