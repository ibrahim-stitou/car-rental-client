'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Loader2
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
import { useLanguage } from '@/context/LanguageContext';
const companyFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, { message: t('consultant.my_companies.create_company.error.company_name_required') }),
    companyid: z.string().min(1, { message: t('consultant.my_companies.create_company.error.company_id_required') }),
    pays_id: z.string().min(1, { message: t('consultant.my_companies.create_company.error.country_required') }),
    IBAN: z.string().min(1, { message: t('consultant.my_companies.create_company.error.iban_required') }),
    bank_name: z.string().min(1, { message: t('consultant.my_companies.create_company.error.bank_name_required') }),
    status: z.enum(['active', 'inactive']).default('active'),
  });
const defaultCompanyFormValues = {
  name: '',
  companyid: '',
  pays_id: '',
  IBAN: '',
  bank_name: '',
  status: 'active'
};

export default function CreateCompanyPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<{ id: number; nom: string }[]>([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const form = useForm({
    resolver: zodResolver(companyFormSchema(t)),
    defaultValues: defaultCompanyFormValues,
    mode: 'onChange',
  });

  const fetchData = useCallback(async () => {
    try {
      const countriesResponse = await apiClient.get(apiRoutes.consultant.consultantCompanies.countries);
      setCountries(countriesResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setSubmitError(t('consultant.my_companies.error.load_country_data'));
      toast.error(t('consultant.my_companies.error.load_country_data'));
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: typeof defaultCompanyFormValues) => {
    setIsLoading(true);
    setSubmitError('');

    try {
      await apiClient.post(apiRoutes.consultant.consultantCompanies.create, data);
      toast.success(t('consultant.my_companies.success.company_created'));
      setTimeout(() => {
        router.push('/consultant/companies');
      }, 2000);
    } catch (error) {
      console.error('Error creating company:', error);

      if (error instanceof Error && (error as any)?.response?.data?.errors) {
        const backendErrors = (error as any)?.response?.data?.errors;
        Object.keys(backendErrors).forEach((field) => {
          if (
            form.getFieldState(field as keyof typeof defaultCompanyFormValues)
          ) {
            form.setError(field as keyof typeof defaultCompanyFormValues, {
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
        toast.error(t('consultant.my_companies.error.validation_error'));
      } else if (error instanceof Error) {
        setSubmitError(error.message || t('consultant.my_companies.error.create_company'));
        toast.error(
          error.message || t('consultant.my_companies.error.create_company')
        );
      } else {
        setSubmitError(t('consultant.my_companies.error.unknown_error'));
        toast.error(t('consultant.my_companies.error.unknown_error'));
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
            {t('consultant.my_companies.create_company.title')}
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
              {/* Company Information */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <h3 className='text-lg font-medium'>{t('consultant.my_companies.create_company.company_info')}</h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('consultant.my_companies.create_company.company_name')}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('consultant.my_companies.create_company.company_name_placeholder')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='companyid'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('consultant.my_companies.create_company.company_id')}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('consultant.my_companies.create_company.company_id_placeholder')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='pays_id'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>{t('consultant.my_companies.create_company.country')}*</FormLabel>
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
                                  : t('consultant.my_companies.create_company.select_country')}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-full p-0' align='start'>
                            <Command>
                              <CommandInput placeholder={t('consultant.my_companies.create_company.search_country')} />
                              <CommandEmpty>{t('consultant.my_companies.create_company.no_country_found')}</CommandEmpty>
                              <CommandGroup className='max-h-64 overflow-y-auto'>
                                {countries.map((country) => (
                                  <CommandItem
                                    value={`${country.id}-${country.nom}`}
                                    key={country.id}
                                    onSelect={() => {
                                      form.setValue(
                                        'pays_id',
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
                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('consultant.my_companies.create_company.status')}*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder={t('consultant.my_companies.create_company.select_status')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='active'>{t('consultant.my_companies.create_company.active')}</SelectItem>
                            <SelectItem value='inactive'>{t('consultant.my_companies.create_company.inactive')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Banking Information */}
                <h3 className='text-lg font-medium pt-2'>{t('consultant.my_companies.create_company.banking_info')}</h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='IBAN'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('consultant.my_companies.create_company.iban')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('consultant.my_companies.create_company.iban_placeholder')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='bank_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('consultant.my_companies.create_company.bank_name')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('consultant.my_companies.create_company.bank_name_placeholder')} />
                        </FormControl>
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
                {t('consultant.my_companies.create_company.cancel')} 
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isLoading ? t('consultant.my_companies.create_company.creating') : t('consultant.my_companies.create_company.create')} 
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}
