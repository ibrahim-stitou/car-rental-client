'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, AlertCircle, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';

import PageContainer from '@/components/layout/page-container';
import { FileUpload } from '@/components/custom/fileUpload';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { cn } from '@/lib/utils';
import { userFormSchema, defaultUserFormValues } from '@/schemas/userSchema';
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

export default function NewUserPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [countries, setCountries] = useState<{ id: number; nom: string }[]>([]);
  const [backendErrors, setBackendErrors] = useState<Record<string, string | string[]>>({});
  const [submitError, setSubmitError] = useState("");
  const [openCountry, setOpenCountry] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultUserFormValues,
    mode: 'onChange'
  });

  const fetchData = useCallback(async () => {
    try {
      const [rolesResponse, countriesResponse] = await Promise.all([
        apiClient.get(apiRoutes.admin.roles.list),
        apiClient.get(apiRoutes.admin.countries.list),
      ]);

      setRoles(rolesResponse.data || []);
      setCountries(countriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSubmitError('Failed to load required data');
      toast.error(t('admin.users.errors.loadFormData'));
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (Object.keys(backendErrors).length > 0) {
        setBackendErrors({});
      }
      if (submitError) {
        setSubmitError("");
      }
    });
    return () => subscription.unsubscribe();
  }, [form, backendErrors, submitError]);

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    //@ts-ignore
    form.setValue('documents', files, { shouldValidate: true });
  };

  const onSubmit = async (data: Record<string, any>) => {
    setIsLoading(true);
    setBackendErrors({});
    setSubmitError("");

    try {
      const userResponse = await apiClient.post(apiRoutes.admin.users.create, data);
      const userId = userResponse.data.data.user.id;

      if (uploadedFiles.length > 0) {
        try {
          const attachResponse = await apiClient.post(apiRoutes.admin.users.attachMedia, {
            model_type: 'User',
            model_id: userId,
            files: uploadedFiles.map(file => ({
              name: file.name,
              path: file.path,
              mime_type: file.mime_type,
              collection_name: file.collection_name || 'default'
            }))
          });

          if (!attachResponse.data.success) {
            throw new Error(t('admin.users.errors.fileAttachment'));
          }
          try {
            await apiClient.post(apiRoutes.files.cleanupTemp, {
              paths: uploadedFiles.map(f => f.path).filter(Boolean)
            });
          } catch (cleanupError) {
            console.warn('Cleanup failed:', cleanupError);
          }
        } catch (fileError) {
          console.error('Attachment error:', fileError);
          toast.error(t('admin.users.toast.createdButAttachmentFailed'));
        }
      }

      toast.success(t('admin.users.toast.createSuccess'));
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);

    } catch (error: any) {
      console.error('Error creating user:', error);

      if (error.response?.status === 422 && error.response?.data?.errors) {
        setBackendErrors(error.response.data.errors);
        toast.error(t('admin.users.errors.validation') + ' ' + Object.values(error.response.data.errors)[0]);
      } else {
        setSubmitError(error.message || t('admin.users.errors.create'));
        toast.error(error.message || t('admin.users.errors.general'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getBackendError = (fieldName: string) => {
    if (!backendErrors[fieldName]) return null;

    return Array.isArray(backendErrors[fieldName])
      ? backendErrors[fieldName][0]
      : backendErrors[fieldName];
  };

  return (
    <PageContainer>
      <div className='h-full w-full space-y-4 overflow-auto bg-gray-50 p-3'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {t('admin.users.create.pageTitle')}
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
                <h3 className='text-lg font-medium'>{t('admin.users.create.personalInfo')}</h3>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='prenom'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.fields.firstName')}*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.users.placeholders.firstName')}
                            {...field}
                            autoComplete='given-name'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('prenom') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {getBackendError('prenom') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('prenom')}
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
                        <FormLabel>{t('admin.users.fields.lastName')}*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.users.placeholders.lastName')}
                            {...field}
                            autoComplete='family-name'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('nom') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {getBackendError('nom') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('nom')}
                          </p>
                        )}
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
                        <FormLabel>{t('admin.users.fields.email')}*</FormLabel>
                        <FormControl>
                          <Input
                            type='email'
                            placeholder={t('admin.users.placeholders.email')}
                            {...field}
                            autoComplete='email'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('email') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {getBackendError('email') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('email')}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='telephone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.fields.phone')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.users.placeholders.phone')}
                            {...field}
                            autoComplete='tel'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('telephone') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {getBackendError('telephone') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('telephone')}
                          </p>
                        )}
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
                        <FormLabel>{t('admin.users.fields.password')}*</FormLabel>
                        <FormControl>
                          <Input
                            type='password'
                            placeholder='••••••••'
                            {...field}
                            autoComplete='new-password'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('password') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {getBackendError('password') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('password')}
                          </p>
                        )}
                        <FormDescription className='text-xs text-gray-500'>
                          {t('admin.users.descriptions.password')}
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
                        <FormLabel>{t('admin.users.fields.confirmPassword')}*</FormLabel>
                        <FormControl>
                          <Input
                            type='password'
                            placeholder='••••••••'
                            {...field}
                            autoComplete='new-password'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('password_confirmation') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {getBackendError('password_confirmation') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('password_confirmation')}
                          </p>
                        )}
                        <FormDescription className='text-xs text-gray-500'>
                          {t('admin.users.descriptions.confirmPassword')}
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
                        <FormLabel>{t('admin.users.fields.gender')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className={cn(
                              'w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('sexe') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}>
                              <SelectValue placeholder={t('admin.users.placeholders.gender')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='M'>{t('admin.users.genders.male')}</SelectItem>
                            <SelectItem value='F'>{t('admin.users.genders.female')}</SelectItem>
                            <SelectItem value='Autre'>{t('admin.users.genders.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {getBackendError('sexe') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('sexe')}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='date_naissance'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>{t('admin.users.fields.birthDate')}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                className={cn(
                                  'w-full justify-start border-gray-300 text-left font-normal focus:border-indigo-500 focus:ring-indigo-500',
                                  !field.value && 'text-muted-foreground',
                                  getBackendError('date_naissance') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                )}
                              >
                                <CalendarIcon className='mr-2 h-4 w-4 opacity-50' />
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>{t('admin.users.placeholders.birthDate')}</span>
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
                              defaultMonth={new Date(new Date().getFullYear() - 18, 0, 1)}
                            />
                          </PopoverContent>
                        </Popover>
                        {getBackendError('date_naissance') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('date_naissance')}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='role_id'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>{t('admin.users.fields.role')}*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                'w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                                getBackendError('role_id') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              )}
                            >
                              <SelectValue placeholder={t('admin.users.placeholders.role')} />
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
                        {getBackendError('role_id') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('role_id')}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem className='w-full md:w-1/3'>
                      <FormLabel>{t('admin.users.fields.status')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(
                            'w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                            getBackendError('status') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          )}>
                            <SelectValue placeholder={t('admin.users.placeholders.status')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='active'>{t('admin.users.statuses.active')}</SelectItem>
                          <SelectItem value='inactive'>{t('admin.users.statuses.inactive')}</SelectItem>
                        </SelectContent>
                      </Select>
                      {getBackendError('status') && (
                        <p className='mt-1 text-sm font-medium text-red-500'>
                          {getBackendError('status')}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* Address Section */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>{t('admin.users.create.addressDetails')}</h3>

                <FormField
                  control={form.control}
                  name='adresse'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.users.fields.address')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('admin.users.placeholders.address')}
                          {...field}
                          autoComplete='street-address'
                          className={cn(
                            'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                            getBackendError('adresse') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          )}
                        />
                      </FormControl>
                      {getBackendError('adresse') && (
                        <p className='mt-1 text-sm font-medium text-red-500'>
                          {getBackendError('adresse')}
                        </p>
                      )}
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
                        <FormLabel>{t('admin.users.fields.city')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.users.placeholders.city')}
                            {...field}
                            autoComplete='address-level2'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('ville') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {getBackendError('ville') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('ville')}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='code_postal'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.fields.postalCode')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.users.placeholders.postalCode')}
                            {...field}
                            autoComplete='postal-code'
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('code_postal') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {getBackendError('code_postal') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('code_postal')}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='pays_id'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.users.fields.country')}</FormLabel>
                        <Popover open={openCountry} onOpenChange={setOpenCountry}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                role='combobox'
                                className={cn(
                                  'w-full justify-between border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                                  getBackendError('pays_id') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                )}
                              >
                                {field.value
                                  ? countries.find(
                                    (country) =>
                                      country.id.toString() === field.value
                                  )?.nom
                                  : t('admin.users.placeholders.country')}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-full p-0' align='start'>
                            <Command>
                              <CommandInput placeholder={t('admin.users.placeholders.searchCountry')} />
                              <CommandEmpty>{t('admin.users.noResults.country')}</CommandEmpty>
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
                                      setOpenCountry(false);
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
                        {getBackendError('pays_id') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('pays_id')}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Professional Information */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>{t('admin.users.create.professionalInfo')}</h3>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='numero_secu'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.fields.socialSecurityNumber')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.users.placeholders.socialSecurityNumber')}
                            {...field}
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('numero_secu') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {getBackendError('numero_secu') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('numero_secu')}
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
                        <FormLabel>{t('admin.users.fields.bankName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.users.placeholders.bankName')}
                            {...field}
                            className={cn(
                              'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                              getBackendError('bank_name') && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                        </FormControl>
                        {getBackendError('bank_name') && (
                          <p className='mt-1 text-sm font-medium text-red-500'>
                            {getBackendError('bank_name')}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.fields.iban')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.users.placeholders.iban')}
                            {...field}
                            className={cn(
                              "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
                              getBackendError("iban") && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                        </FormControl>
                        {getBackendError("iban") && (
                          <p className="mt-1 text-sm font-medium text-red-500">
                            {getBackendError("iban")}
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
                <h3 className='text-lg font-medium'>{t('admin.users.create.emergencyContact')}</h3>

                <FormField
                  control={form.control}
                  name="emergency_fullname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.users.fields.emergencyName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('admin.users.placeholders.emergencyName')}
                          {...field}
                          autoComplete="name"
                          className={cn(
                            "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
                            getBackendError("emergency_fullname") && "border-red-500 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                      </FormControl>
                      {getBackendError("emergency_fullname") && (
                        <p className="mt-1 text-sm font-medium text-red-500">
                          {getBackendError("emergency_fullname")}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name="emergency_tel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.fields.emergencyPhone')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('admin.users.placeholders.emergencyPhone')}
                            {...field}
                            autoComplete="tel"
                            className={cn(
                              "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
                              getBackendError("emergency_tel") && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                        </FormControl>
                        {getBackendError("emergency_tel") && (
                          <p className="mt-1 text-sm font-medium text-red-500">
                            {getBackendError("emergency_tel")}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergency_relation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.fields.relationship')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className={cn(
                              "w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
                              getBackendError("emergency_relation") && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}>
                              <SelectValue placeholder={t('admin.users.placeholders.relationship')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="spouse">{t('admin.users.relationships.spouse')}</SelectItem>
                            <SelectItem value="parent">{t('admin.users.relationships.parent')}</SelectItem>
                            <SelectItem value="child">{t('admin.users.relationships.child')}</SelectItem>
                            <SelectItem value="sibling">{t('admin.users.relationships.sibling')}</SelectItem>
                            <SelectItem value="friend">{t('admin.users.relationships.friend')}</SelectItem>
                            <SelectItem value="other">{t('admin.users.relationships.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {getBackendError("emergency_relation") && (
                          <p className="mt-1 text-sm font-medium text-red-500">
                            {getBackendError("emergency_relation")}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Documents section */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>{t('admin.users.create.documents')}</h3>
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
                        modelId={form.watch('id') || 'temporary'}
                        showTabs={true}
                        collection='id_documents'
                        onFilesChange={handleFilesChange}
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
                {isLoading ? t('admin.users.actions.creating') : t('admin.users.actions.create')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}