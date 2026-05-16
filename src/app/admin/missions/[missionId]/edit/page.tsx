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
import {
  createMissionFormSchema,
  defaultMissionFormValues
} from '@/schemas/missionSchema';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

export default function EditMissionPage({
                                          params
                                        }: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; fullname: string }[]>([]);
  const [countries, setCountries] = useState<{ id: number; nom: string }[]>([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [missionDocuments, setMissionDocuments] = useState<UploadedFile[]>([]);

  const form = useForm<typeof defaultMissionFormValues>({
    resolver: zodResolver(createMissionFormSchema(t)),
    defaultValues: defaultMissionFormValues,
    mode: 'onChange'
  });

  const fetchMissionData = useCallback(async () => {
    try {
      const response = await apiClient.get(
        apiRoutes.admin.missions.detail(missionId)
      );
      const missionData = response.data.data.mission;
      if (missionData.date_debut) {
        missionData.date_debut = new Date(missionData.date_debut);
      }
      if (missionData.date_fin) {
        missionData.date_fin = new Date(missionData.date_fin);
      }
      if (missionData.client_id) {
        missionData.client_id = missionData.client_id.toString();
      }
      if (missionData.user_id) {
        missionData.user_id = missionData.user_id.toString();
      }
      if (missionData.country_id) {
        missionData.country_id = missionData.country_id.toString();
      }

      // Set existing document if available
      // After setting missionDocument in fetchMissionData
      if (Array.isArray(missionData.media) && missionData.media.length > 0) {
        const mapped: UploadedFile[] = missionData.media.map((m: any) => ({
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
        setMissionDocuments(mapped);
        // @ts-ignore
        form.setValue('mission_document_paths', mapped.map((x) => x.path || x.url).filter(Boolean));
      }

      form.reset(missionData);
    } catch (error) {
      console.error('Error loading mission data:', error);
      toast.error(t('admin.missions.error.loadFailed'));
      setSubmitError(t('admin.missions.edit.loading'));
    }
  }, [missionId, form, t]);
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [clientsResponse, usersResponse, countriesResponse] =
        await Promise.all([
          apiClient.get(apiRoutes.common.clientsList),
          apiClient.get(apiRoutes.common.consultantList),
          apiClient.get(apiRoutes.admin.countries.list)
        ]);
      setClients(clientsResponse.data.data || []);
      setUsers(usersResponse.data.data || []);
      setCountries(countriesResponse.data || []);
      await fetchMissionData();
    } catch (error) {
      console.error('Error fetching data:', error);
      setSubmitError(t('common.errorLoading'));
      toast.error(t('common.errorLoading'));
    } finally {
      setIsLoadingData(false);
    }
  }, [fetchMissionData, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: typeof defaultMissionFormValues) => {
    setIsLoading(true);
    setSubmitError('');

    try {
      await apiClient.put(apiRoutes.admin.missions.update(missionId), data);
      toast.success(t('admin.missions.edit.success'));
      setTimeout(() => {
        router.push('/admin/missions');
      }, 2000);
    } catch (error) {
      console.error('Error updating mission:', error);

      if (error instanceof Error && (error as any)?.response?.data?.errors) {
        const backendErrors = (error as any)?.response?.data?.errors;
        Object.keys(backendErrors).forEach((field) => {
          if (
            form.getFieldState(field as keyof typeof defaultMissionFormValues)
          ) {
            form.setError(field as keyof typeof defaultMissionFormValues, {
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
        toast.error(t('common.validationError'));
      } else if (error instanceof Error) {
        setSubmitError(error.message || t('admin.missions.edit.error'));
        toast.error(
          error.message || t('admin.missions.edit.errorGeneric')
        );
      } else {
        setSubmitError(t('common.unknownError'));
        toast.error(t('common.unknownError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className='grid grid-cols-1 gap-6 p-6 md:grid-cols-2'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-10 w-full' />
          </div>
        ))}
      </div>
    );
  }

  return (
    <PageContainer>
      <div className='h-full w-full space-y-4 overflow-auto bg-gray-50 p-3'>
        <div className='flex items-start justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>{t('admin.missions.edit.title')}</h1>
        </div>

        {submitError && (
          <Alert variant='destructive' className='border-red-400 bg-red-50'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-2'>
            <CardContent className='space-y-6 pt-4'>
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>{t('admin.missions.show.missionDetails')}</h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='title'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.missions.form.title')}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.missions.form.title')} />
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
                        <FormLabel>{t('admin.missions.form.status')}*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder={t('admin.missions.form.selectStatus')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='active'>{t('admin.missions.status.active')}</SelectItem>
                            <SelectItem value='inactive'>{t('admin.missions.status.inactive')}</SelectItem>
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
                    name='client_id'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.missions.form.client')}*</FormLabel>
                        <Popover open={clientOpen} onOpenChange={setClientOpen}>
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
                                  ? clients.find(
                                    (client) =>
                                      client.id.toString() === field.value
                                  )?.name
                                  : t('admin.missions.form.selectClient')}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-full p-0' align='start'>
                            <Command>
                              <CommandInput placeholder={t('dataTable.search.placeholder')} />
                              <CommandEmpty>{t('dataTable.noData')}</CommandEmpty>
                              <CommandGroup className='max-h-64 overflow-y-auto'>
                                {clients.map((client) => (
                                  <CommandItem
                                    value={`${client.id}-${client.name}`}
                                    key={client.id}
                                    onSelect={() => {
                                      form.setValue(
                                        'client_id',
                                        client.id.toString()
                                      );
                                      setClientOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        client.id.toString() === field.value
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      )}
                                    />
                                    {client.name}
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
                    name='user_id'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.missions.form.consultant')}*</FormLabel>
                        <Popover open={userOpen} onOpenChange={setUserOpen}>
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
                                  ? users.find(
                                    (user) =>
                                      user.id.toString() === field.value
                                  )?.fullname
                                  : t('admin.missions.form.selectConsultant')}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-full p-0' align='start'>
                            <Command>
                              <CommandInput placeholder={t('dataTable.search.placeholder')} />
                              <CommandEmpty>{t('dataTable.noData')}</CommandEmpty>
                              <CommandGroup className='max-h-64 overflow-y-auto'>
                                {users.map((user) => (
                                  <CommandItem
                                    value={`${user.id}-${user.fullname}`}
                                    key={user.id}
                                    onSelect={() => {
                                      form.setValue(
                                        'user_id',
                                        user.id.toString()
                                      );
                                      setUserOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        user.id.toString() === field.value
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      )}
                                    />
                                    {user.fullname}
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
                </div>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='tjm'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.missions.form.tjm')}*</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type='number'
                            placeholder={t('admin.missions.form.tjm')}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='tjm_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.missions.form.tjmType')}*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder={t('admin.missions.form.tjmType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='forfait'>{t('admin.missions.form.dailyRate')}</SelectItem>
                            <SelectItem value='journalier'>{t('admin.missions.form.hourlyRate')}</SelectItem>
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
                    name='date_debut'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.missions.form.startDate')}*</FormLabel>
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
                                  : t('common.selectDate')}
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
                                field.onChange(date);
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
                    name='date_fin'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.missions.form.endDate')}</FormLabel>
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
                                  : t('common.selectDate')}
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
                                field.onChange(date);
                                setEndDateOpen(false);
                              }}
                              initialFocus
                              disabled={(date) => {
                                const startDate = form.getValues('date_debut');
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
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='adresse_prin'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.missions.form.address')}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.missions.form.address')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='consultant_reference'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.missions.form.consultant_reference')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={(field.value ?? '') as any}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            placeholder={t('admin.missions.form.consultant_reference')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='country_id'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.missions.form.country')}*</FormLabel>
                        <Popover
                          open={countryOpen}
                          onOpenChange={setCountryOpen}
                        >
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
                                  ? countries.find(
                                    (country) =>
                                      country.id.toString() === field.value
                                  )?.nom
                                  : t('admin.missions.form.selectCountry')}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-full p-0' align='start'>
                            <Command>
                              <CommandInput placeholder={t('dataTable.search.placeholder')} />
                              <CommandEmpty>{t('dataTable.noData')}</CommandEmpty>
                              <CommandGroup className='max-h-64 overflow-y-auto'>
                                {countries.map((country) => (
                                  <CommandItem
                                    value={`${country.id}-${country.nom}`}
                                    key={country.id}
                                    onSelect={() => {
                                      form.setValue(
                                        'country_id',
                                        country.id.toString()
                                      );
                                      setCountryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        country.id.toString() === field.value
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      )}
                                    />
                                    {country.nom}
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
                </div>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='taux_fkm'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.missions.form.taux_fkm')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type='number'
                            step='0.01'
                            placeholder={t('admin.missions.form.taux_fkmPlaceholder')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem className="h-full flex flex-col">
                        <FormLabel>{t('admin.missions.form.description')}*</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('admin.missions.form.descriptionPlaceholder')}
                            className="min-h-20 flex-1 mb-2 "
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col h-full">
                    <FormField
                      control={form.control}
                      name="mission_document_paths"
                      render={() => (
                        <FormItem className="flex-1 flex flex-col">
                          <FormLabel className='flex items-center gap-2'>
                            <IconFileText className='h-4 w-4 text-primary' />
                            {t('admin.missions.form.fields.document') || 'Mission Document'}
                          </FormLabel>
                          <MultiFileUpload
                            label=""
                            value={missionDocuments}
                            onFilesChangeAction={(files) => {
                              setMissionDocuments(files);
                              // @ts-ignore
                              form.setValue('mission_document_paths', files.map((f) => f.path || f.url).filter(Boolean), { shouldValidate: true });
                            }}
                            description={t('admin.missions.form.placeholders.documentDescription') || 'Upload mission documents (PDF)'}
                            accept={{ "application/pdf": [".pdf"] }}
                            maxSize={5}
                            maxFiles={10}
                            disabled={isLoading}
                            collection="mission_documents"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                {isLoading ? t('admin.missions.edit.updating') : t('admin.missions.edit.title')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}
