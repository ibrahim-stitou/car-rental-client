'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { toast } from '@/components/ui/sonner';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { clientFormSchema, defaultClientFormValues } from '@/schemas/clientSchema';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function CreateClientPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<{ id: number; nom: string }[]>([]);
  const [backendErrors, setBackendErrors] = useState<Record<string, string | string[]>>({});
  const [submitError, setSubmitError] = useState("");
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultClientFormValues,
    mode: 'onChange',
  });

  const fetchCountries = useCallback(async () => {
    try {
      const response = await apiClient.get(apiRoutes.admin.countries.list);
      setCountries(response.data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setSubmitError(t('admin.clients.errorLoadingCountries') || 'Failed to load countries');
    }
  }, [t]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const onSubmit = async (data: typeof defaultClientFormValues) => {
    setIsLoading(true);
    setBackendErrors({});
    setSubmitError("");

    try {
      await apiClient.post(apiRoutes.admin.clients.create, data);
      toast.success(t('admin.clients.create.success') || 'Client created successfully');
      setTimeout(() => {
        router.push('/admin/clients');
      }, 2000);
    } catch (error: any) {
      console.error('Error creating client:', error);
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((field) => {
          form.setError(field as keyof typeof defaultClientFormValues, {
            type: 'server',
            message: backendErrors[field][0],
          });
        });
        toast.error(t('admin.clients.create.validationError') || 'Validation error: Please check the form.');
      } else {
        setSubmitError(error.message || t('admin.clients.create.error') || 'Failed to create client');
        toast.error(error.message || t('admin.clients.create.errorGeneric') || 'An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className='h-full w-full space-y-4 overflow-auto bg-gray-50 p-3'>
        <div className='flex items-start justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('admin.clients.create.title') || 'Create New Client'}
          </h1>
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
              {/* Client Information */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>{t('admin.clients.form.clientInfoTitle') || 'Client Information'}</h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.clients.form.name') || 'Name'}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.clients.form.namePlaceholder') || 'Client Name'} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='idnumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.form.fields.siret') || 'Identifier'}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.clients.form.identifierPlaceholder') || 'Unique Identifier'} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='capital'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.clients.form.capital') || 'Capital'}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type='number'
                            placeholder={t('admin.clients.form.capitalPlaceholder') || 'Capital Amount'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='phone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.clients.form.phone') || 'Phone'}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.clients.form.phonePlaceholder') || '+123456789'} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='mail'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.clients.form.email') || 'Email'}*</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type='email'
                            placeholder={t('admin.clients.form.emailPlaceholder') || 'client@example.com'}
                          />
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
                        <FormLabel>{t('admin.clients.form.status') || 'Status'}*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder={t('admin.clients.form.selectStatus') || 'Select status'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='active'>{t('admin.clients.status.active') || 'Active'}</SelectItem>
                            <SelectItem value='inactive'>{t('admin.clients.status.inactive') || 'Inactive'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Address Information */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>{t('admin.clients.form.addressInfoTitle') || 'Address Information'}</h3>
                <FormField
                  control={form.control}
                  name='address'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.clients.form.address') || 'Address'}*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('admin.clients.form.addressPlaceholder') || '123 Main Street'} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='city'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.clients.form.city') || 'City'}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.clients.form.cityPlaceholder') || 'City'} />
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
                        <FormLabel>{t('admin.clients.form.postalCode') || 'Postal Code'}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.clients.form.postalCodePlaceholder') || '12345'} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='country_id'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('admin.clients.form.country') || 'Country'}*</FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
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
                                    (country) => country.id.toString() === field.value
                                  )?.nom
                                  : t('admin.clients.form.selectCountry') || 'Select country'}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-full p-0' align='start'>
                            <Command>
                              <CommandInput placeholder={t('admin.clients.form.searchCountry') || 'Search country...'} />
                              <CommandEmpty>{t('admin.clients.form.noCountryFound') || 'No country found.'}</CommandEmpty>
                              <CommandGroup className='max-h-64 overflow-y-auto'>
                                {countries.map((country) => (
                                  <CommandItem
                                    value={country.nom}
                                    key={country.id}
                                    onSelect={() => {
                                      form.setValue('country_id', country.id.toString());
                                      setOpen(false);
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
                  <FormField
                    control={form.control}
                    name='reference_special'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.clients.form.reference_special') || 'Référence spécial'}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.clients.form.reference_specialplaceholder') || 'ref-----'} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Banking Information */}
              {/*<section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>*/}
              {/*  <h3 className='text-lg font-medium'>{t('admin.clients.form.bankingInfoTitle') || 'Banking Information'}</h3>*/}
              {/*  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>*/}
              {/*    <FormField*/}
              {/*      control={form.control}*/}
              {/*      name='iban'*/}
              {/*      render={({ field }) => (*/}
              {/*        <FormItem>*/}
              {/*          <FormLabel>{t('admin.clients.form.iban') || 'IBAN'}</FormLabel>*/}
              {/*          <FormControl>*/}
              {/*            <Input {...field} placeholder={t('admin.clients.form.ibanPlaceholder') || 'IBAN'} />*/}
              {/*          </FormControl>*/}
              {/*          <FormMessage />*/}
              {/*        </FormItem>*/}
              {/*      )}*/}
              {/*    />*/}
              {/*    <FormField*/}
              {/*      control={form.control}*/}
              {/*      name='bic'*/}
              {/*      render={({ field }) => (*/}
              {/*        <FormItem>*/}
              {/*          <FormLabel>{t('admin.clients.form.bic') || 'BIC'}</FormLabel>*/}
              {/*          <FormControl>*/}
              {/*            <Input {...field} placeholder={t('admin.clients.form.bicPlaceholder') || 'BIC'} />*/}
              {/*          </FormControl>*/}
              {/*          <FormMessage />*/}
              {/*        </FormItem>*/}
              {/*      )}*/}
              {/*    />*/}
              {/*  </div>*/}
              {/*</section>*/}
            </CardContent>

            <CardFooter className='flex justify-between border-t pt-6'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                disabled={isLoading}
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isLoading ? (t('admin.clients.create.creating') || 'Creating...') : (t('admin.clients.create.submit') || 'Create Client')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}