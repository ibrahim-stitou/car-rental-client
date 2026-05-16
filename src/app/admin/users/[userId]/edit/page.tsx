'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format, isValid } from 'date-fns';
import {
  CalendarIcon,
  Loader2,
  AlertCircle,
  ChevronsUpDown,
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { cn } from '@/lib/utils';
import { userFormSchema, defaultUserFormValues } from '@/schemas/userSchema';
import PageContainer from '@/components/layout/page-container';
import { toast } from '@/components/ui/sonner';
import { FileUpload } from '@/components/custom/fileUpload';
import { Skeleton } from '@/components/ui/skeleton';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { useLanguage } from '@/context/LanguageContext';

interface UploadedFile {
  id?: number;
  name: string;
  url?: string;
  mime_type: string;
  size: number;
  file?: File;
  path?: string;
  file_name?: string;
  collection_name?: string;
  created_at?: string;
}

interface UserMedia {
  id: number;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
  collection_name: string;
  created_at: string;
}

export default function EditUserPage({
                                       params
                                     }: {
  params: Promise<{ userId: string }>;
}) {
  const { t } = useLanguage();
  const { userId } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [countries, setCountries] = useState<{ id: number; nom: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [backendErrors, setBackendErrors] = useState<
    Record<string, string | string[]>
  >({});
  const [submitError, setSubmitError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<
    Record<string, UserMedia[]>
  >({});
  const [loading, setLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultUserFormValues,
    mode: 'onChange'
  });

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const [rolesResponse, countriesResponse, userResponse] =
        await Promise.all([
          apiClient.get(apiRoutes.admin.roles.list),
          apiClient.get(apiRoutes.admin.countries.list),
          apiClient.get(apiRoutes.admin.users.detail(userId))
        ]);

      setRoles(rolesResponse.data || []);
      setCountries(countriesResponse.data || []);

      if (userResponse.data) {
        const userData = userResponse.data.data;

        let dateOfBirth = null;
        if (userData.date_naissance) {
          const dateParts = userData.date_naissance.split('-');
          if (dateParts.length === 3) {
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const day = parseInt(dateParts[2]);
            dateOfBirth = new Date(year, month, day);
            if (!isValid(dateOfBirth)) dateOfBirth = null;
          }
        }

        form.reset({
          prenom: userData.prenom || '',
          nom: userData.nom || '',
          email: userData.email || '',
          telephone: userData.telephone || '',
          password: '',
          password_confirmation: '',
          sexe: userData.sexe || '',
          date_naissance: dateOfBirth || undefined,
          role_id: userData.role_id ? userData.role_id.toString() : '',
          adresse: userData.adresse || '',
          ville: userData.ville || '',
          code_postal: userData.code_postal || '',
          pays_id: userData.pays_id ? userData.pays_id.toString() : '',
          numero_secu: userData.numero_secu || '',
          emergency_fullname: userData.emergency_fullname || '',
          emergency_tel: userData.emergency_tel || '',
          emergency_relation: userData.emergency_relation || '',
          status: userData.status || 'pending',
          bank_name: userData.bank_name || '',
          iban: userData.iban || ''
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setSubmitError(t('admin.users.edit.errors.loadFailed'));
    } finally {
      setIsFetching(false);
    }
  }, [userId, form, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (Object.keys(backendErrors).length > 0) {
        setBackendErrors({});
      }
      if (submitError) {
        setSubmitError('');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, backendErrors, submitError]);

  const handleFilesChange = useCallback(
    (files: UploadedFile[]) => {
      setUploadedFiles(files);
      //@ts-ignore
      form.setValue('documents', files, { shouldValidate: true });
    },
    [form]
  );

  const onSubmit = async (data: Record<string, any>) => {
    setIsLoading(true);
    setBackendErrors({});
    setSubmitError('');

    try {
      const formData = new FormData();

      // Add regular form data
      Object.entries(data).forEach(([key, value]) => {
        if (
          (key === 'password' || key === 'password_confirmation') &&
          (!value || value === '')
        ) {
          return;
        }

        if (key === 'date_naissance' && data[key]) {
          formData.append(key, format(data[key], 'yyyy-MM-dd'));
        } else if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      // Handle file uploads
      if (uploadedFiles.length > 0) {
        // Append existing file references
        formData.append('existing_files', JSON.stringify(uploadedFiles));
      }

      formData.append('_method', 'PUT');

      const response = await apiClient.post(
        apiRoutes.admin.users.update(userId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data?.success) {
        toast.success(t('admin.users.edit.success'));
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      //@ts-ignore
      if (error.response?.data?.errors) {
        //@ts-ignore
        setBackendErrors(error.response.data.errors);
      } else {
        setSubmitError(t('admin.users.edit.errors.updateFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserMedia = async () => {
      try {
        setLoading(true);
        //@ts-ignore
        const response = await apiClient.get<ApiResponse>(
          apiRoutes.admin.users.getMedia(userId)
        );
        const mediaData = response.data.data;
        const groupedFiles = mediaData.reduce(
          //@ts-ignore
          (acc, file) => {
            const collection = file.collection_name;
            acc[collection] = acc[collection] || [];
            acc[collection].push(file);
            return acc;
          },
          {} as Record<string, UserMedia[]>
        );

        setExistingFiles(groupedFiles);
        setUploadedFiles(mediaData);
      } catch (err) {
        console.error('Error fetching media:', err);
        toast.error(t('admin.users.edit.errors.loadDocumentsFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserMedia();
  }, [userId, t]);


  if (isFetching) {
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
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {t('admin.users.edit.title')}
            </h1>
          </div>
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
                <h3 className='text-lg font-medium'>
                  {t('admin.users.form.sections.personal')}
                </h3>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='prenom'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.form.fields.firstName')}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'admin.users.form.placeholders.firstName'
                            )}
                            {...field}
                            autoComplete='given-name'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              backendErrors.prenom &&
                                'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {backendErrors.prenom && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {Array.isArray(backendErrors.prenom)
                              ? backendErrors.prenom[0]
                              : backendErrors.prenom}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='nom'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.form.fields.lastName')}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'admin.users.form.placeholders.lastName'
                            )}
                            {...field}
                            autoComplete='family-name'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              backendErrors.nom &&
                                'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
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
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.form.fields.email')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='email'
                            placeholder={t(
                              'admin.users.form.placeholders.email'
                            )}
                            {...field}
                            autoComplete='email'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              backendErrors.email &&
                                'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='telephone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.form.fields.phone')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'admin.users.form.placeholders.phone'
                            )}
                            {...field}
                            autoComplete='tel'
                            className='border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
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
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.form.fields.password')}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='password'
                            placeholder='••••••••'
                            {...field}
                            autoComplete='new-password'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              backendErrors.password &&
                                'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          {t('admin.users.form.descriptions.password')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='password_confirmation'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.form.fields.confirmPassword')}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='password'
                            placeholder='••••••••'
                            {...field}
                            autoComplete='new-password'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              backendErrors.password_confirmation &&
                                'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          {t('admin.users.form.descriptions.confirmPassword')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='sexe'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>
                          {t('admin.users.form.fields.gender')}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'>
                              <SelectValue
                                placeholder={t(
                                  'admin.users.form.placeholders.gender'
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='M'>
                              {t('admin.users.form.options.gender.male')}
                            </SelectItem>
                            <SelectItem value='F'>
                              {t('admin.users.form.options.gender.female')}
                            </SelectItem>
                            <SelectItem value='Autre'>
                              {t('admin.users.form.options.gender.other')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='date_naissance'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>
                          {t('admin.users.form.fields.birthDate')}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                className={cn(
                                  'w-full justify-start border-gray-300 text-left font-normal focus:border-indigo-500 focus:ring-indigo-500',
                                  !field.value && 'text-muted-foreground',
                                  form.formState.errors?.date_naissance &&
                                    'border-red-500 focus:border-red-500 focus:ring-red-500'
                                )}
                              >
                                <CalendarIcon className='mr-2 h-4 w-4 opacity-50' />
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>
                                    {t(
                                      'admin.users.form.placeholders.birthDate'
                                    )}
                                  </span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date('1900-01-01')
                              }
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
                    name='role_id'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>
                          {t('admin.users.form.fields.role')}*
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                'w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                                backendErrors.role_id &&
                                  'border-red-500 focus:border-red-500 focus:ring-red-500'
                              )}
                            >
                              <SelectValue
                                placeholder={t(
                                  'admin.users.form.placeholders.role'
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id.toString()}
                              >
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('admin.users.form.fields.status')}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'>
                              <SelectValue
                                placeholder={t(
                                  'admin.users.form.placeholders.status'
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='active'>
                              {t('admin.users.form.options.status.active')}
                            </SelectItem>
                            <SelectItem value='inactive'>{t('admin.users.statuses.inactive')}</SelectItem>
                            <SelectItem value='suspended'>
                              {t('admin.users.form.options.status.suspended')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>
                  {t('admin.users.form.sections.address')}
                </h3>

                <FormField
                  control={form.control}
                  name='adresse'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className=''>
                        {t('admin.users.form.fields.address')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'admin.users.form.placeholders.address'
                          )}
                          {...field}
                          autoComplete='street-address'
                          className='border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='ville'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.form.fields.city')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'admin.users.form.placeholders.city'
                            )}
                            {...field}
                            autoComplete='address-level2'
                            className='border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='code_postal'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.form.fields.postalCode')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'admin.users.form.placeholders.postalCode'
                            )}
                            {...field}
                            autoComplete='postal-code'
                            className='border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='pays_id'
                    render={({ field }) => {
                      // Find the country corresponding to the current value
                      const selectedCountry = countries.find(
                        (country) => country.id.toString() === field.value
                      );

                      return (
                        <FormItem className='flex flex-col'>
                          <FormLabel>
                            {t('admin.users.form.fields.country')}
                          </FormLabel>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant='outline'
                                  role='combobox'
                                  className='w-full justify-between border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                                >
                                  {selectedCountry
                                    ? selectedCountry.nom
                                    : t(
                                        'admin.users.form.placeholders.country'
                                      )}
                                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className='w-full p-0'
                              align='start'
                            >
                              <Command>
                                <CommandInput
                                  placeholder={t(
                                    'admin.users.form.actions.searchCountry'
                                  )}
                                />
                                <CommandEmpty>
                                  {t('admin.users.form.messages.noCountry')}
                                </CommandEmpty>
                                <CommandGroup className='max-h-64 overflow-y-auto'>
                                  {countries.map((country) => (
                                    <CommandItem
                                      key={country.id}
                                      value={country.nom}
                                      onSelect={() => {
                                        form.setValue(
                                          'pays_id',
                                          country.id.toString()
                                        );
                                        setOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          field.value === country.id.toString()
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
                      );
                    }}
                  />
                </div>
              </section>

              {/* Professional Information */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>
                  {t('admin.users.form.sections.professional')}
                </h3>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='numero_secu'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.form.fields.socialSecurity')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'admin.users.form.placeholders.socialSecurity'
                            )}
                            {...field}
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              backendErrors.numero_secu &&
                                'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {backendErrors.numero_secu && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {Array.isArray(backendErrors.numero_secu)
                              ? backendErrors.numero_secu[0]
                              : backendErrors.numero_secu}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='bank_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.form.fields.bankName')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='BNP Paribas'
                            {...field}
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              backendErrors.bank_name &&
                                'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {backendErrors.bank_name && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {Array.isArray(backendErrors.bank_name)
                              ? backendErrors.bank_name[0]
                              : backendErrors.bank_name}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='iban'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className=''>
                          {t('admin.users.fields.iban')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.users.placeholders.iban')}
                            {...field}
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              backendErrors.iban &&
                                'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {backendErrors.iban && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {Array.isArray(backendErrors.iban)
                              ? backendErrors.iban[0]
                              : backendErrors.iban}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>
              {/* Emergency Contact */}
              <section className='space-y-4 rounded-md border border-amber-300 bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>
                  {t('admin.users.create.emergencyContact')}
                </h3>

                <FormField
                  control={form.control}
                  name='emergency_fullname'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('admin.users.fields.emergencyName')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'admin.users.placeholders.emergencyName'
                          )}
                          {...field}
                          autoComplete='name'
                          className={cn(
                            'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                            backendErrors.emergency_fullname &&
                              'border-red-500 focus:border-red-500 focus:ring-red-500'
                          )}
                        />
                      </FormControl>
                      {backendErrors.emergency_fullname && (
                        <p className='mt-1 text-sm font-medium text-red-500'>
                          {Array.isArray(backendErrors.emergency_fullname)
                            ? backendErrors.emergency_fullname[0]
                            : backendErrors.emergency_fullname}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='emergency_tel'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('admin.users.fields.emergencyPhone')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'admin.users.placeholders.emergencyPhone'
                            )}
                            {...field}
                            autoComplete='tel'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              backendErrors.emergency_tel &&
                                'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {backendErrors.emergency_tel && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {Array.isArray(backendErrors.emergency_tel)
                              ? backendErrors.emergency_tel[0]
                              : backendErrors.emergency_tel}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='emergency_relation'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('admin.users.fields.relationship')}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                'w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                                backendErrors.emergency_relation &&
                                  'border-red-500 focus:border-red-500 focus:ring-red-500'
                              )}
                            >
                              <SelectValue
                                placeholder={t(
                                  'admin.users.placeholders.relationship'
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='spouse'>
                              {t('admin.users.relationships.spouse')}
                            </SelectItem>
                            <SelectItem value='parent'>
                              {t('admin.users.relationships.parent')}
                            </SelectItem>
                            <SelectItem value='child'>
                              {t('admin.users.relationships.child')}
                            </SelectItem>
                            <SelectItem value='sibling'>
                              {t('admin.users.relationships.sibling')}
                            </SelectItem>
                            <SelectItem value='friend'>
                              {t('admin.users.relationships.friend')}
                            </SelectItem>
                            <SelectItem value='other'>
                              {t('admin.users.relationships.other')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {backendErrors.emergency_relation && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {Array.isArray(backendErrors.emergency_relation)
                              ? backendErrors.emergency_relation[0]
                              : backendErrors.emergency_relation}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Documents Section */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>
                  {t('admin.users.create.documents')}
                </h3>
                <FormField
                  control={form.control}
                  //@ts-ignore
                  name='documents'
                  render={() => (
                    <FormItem>
                      <FileUpload
                        name='documents'
                        maxSize={10}
                        modelType='users'
                        //@ts-ignore
                        modelId={userId}
                        showTabs={true}
                        collection='id_documents'
                        onFilesChange={handleFilesChange}
                        existingFiles={existingFiles}
                        previewHeight='h-96'
                        disabled={isLoading}
                      />
                      <FormDescription className='text-xs text-gray-500'>
                        {t('admin.users.descriptions.documents')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                {isLoading
                  ? t('admin.users.actions.updating')
                  : t('admin.users.actions.update')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
  }
