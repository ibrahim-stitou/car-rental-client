import PageContainer from '@/components/layout/page-container';
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
import { useLanguage } from '@/context/LanguageContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CardContent, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import ConsultantSelect from '@/components/custom/consultant-select';
import { Checkbox } from '@/components/ui/checkbox';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { PATHS } from '@/config/paths';
import { useRouter } from 'next/navigation';
import SalaryFileUpload, { UploadedFile } from '../components/salary-file-upload';
import { useState } from 'react';


const SalaryCreate = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const { t } = useLanguage();
  const router = useRouter();
  const salarySchema = z.object({
    employer_contribution: z
      .string()
      .refine(
        (val) =>
          /^(\d+([.,]\d{1,2})?)$/.test(val) &&
          parseFloat(val.replace(',', '.')) >= 0 &&
          parseFloat(val.replace(',', '.')) <= 999999999,
        {
          message: 'Value must be a number between 0 and 999999999 (decimals allowed, use . or ,)'
        }
      ),
    employee_contribution: z
      .string()
      .refine(
        (val) =>
          /^(\d+([.,]\d{1,2})?)$/.test(val) &&
          parseFloat(val.replace(',', '.')) >= 0 &&
          parseFloat(val.replace(',', '.')) <= 999999999,
        {
          message: 'Value must be a number between 0 and 999999999 (decimals allowed, use . or ,)'
        }
      ),
    net_salary: z
      .string()
      .refine(
        (val) =>
          /^(\d+([.,]\d{1,2})?)$/.test(val) &&
          parseFloat(val.replace(',', '.')) >= 0 &&
          parseFloat(val.replace(',', '.')) <= 999999999,
        {
          message: 'Value must be a number between 0 and 999999999 (decimals allowed, use . or ,)'
        }
      ),
    tax: z
      .string()
      .refine(
        (val) =>
          /^(\d+([.,]\d{1,2})?)$/.test(val) &&
          parseFloat(val.replace(',', '.')) >= 0 &&
          parseFloat(val.replace(',', '.')) <= 999999999,
        {
          message: 'Value must be a number between 0 and 999999999 (decimals allowed, use . or ,)'
        }
      ),
    consultant: z.string().optional(),
    year: z
      .string()
      .refine(
        (val) =>
          /^\d+$/.test(val) && parseInt(val) >= 2000 && parseInt(val) <= 2200,
        {
          message: 'Year must be a number between 2000 and 2200'
        }
      ),
    month: z.string().optional(),
  });
  const methods = useForm({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      employer_contribution: '0',
      employee_contribution: '0',
      net_salary: '0',
      tax: '0',
      consultant: '',
      month: '',
      year: '',
    }
  });

  const onSubmit = async (data: z.infer<typeof salarySchema>) => {
    // Reset file error
    setFileError('');

    // Include the file path if a file is uploaded
    const submitData = {
      ...data,
      file: uploadedFile ? uploadedFile.path : undefined
    };

    apiClient
      .post(apiRoutes.admin.salaries.create, submitData)
      .then((response) => {
        toast.success(response.data.message);
        router.push(PATHS.admin.salaries.list.link);
      })
      .catch((error) => {
        if (error instanceof AxiosError && error.response?.status === 422) {
          const errorData = error.response.data;
          if (errorData?.errors) {
            Object.keys(errorData.errors).forEach((fieldName) => {
              const messages = errorData.errors[fieldName];
              if (messages && messages.length > 0) {
                // Handle file errors separately
                if (fieldName === 'file') {
                  setFileError(messages.join(', '));
                } else {
                  methods.setError(
                    fieldName as keyof z.infer<typeof salarySchema>,
                    {
                      type: 'server',
                      message: messages.join(', ')
                    }
                  );
                }
              }
            });
          } else if (errorData?.message) {
            toast.error(errorData.message);
          } else {
            toast.error(errorData);
          }
        } else {
          toast.error('An error occurred while creating the salary.');
        }
      });
  };

  return (
    <PageContainer>
      <div className='h-full w-full space-y-4 overflow-auto bg-gray-50 p-3 md:p-6'>
        <div className='flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center'>
          <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>
            {t('admin.salaries.create.title')}
          </h1>
        </div>

        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className='space-y-4'>
            <CardContent className='space-y-4 pt-4'>
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm sm:p-6'>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {/* Consultant Select */}
                  <ConsultantSelect
                    name='consultant'
                    form={methods}
                    label={t('admin.salaries.create.consultant')}
                    placeholder={t('admin.salaries.create.consultantSelect')}
                    required
                  />

                  {/* Month */}
                  <FormField
                    name='month'
                    control={methods.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.salaries.create.month')}
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className='w-full'>
                              <SelectValue
                                placeholder={t(
                                  'admin.salaries.create.monthSelect'
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={`${i + 1}`}>
                                  {t(`months.${i + 1}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Year */}
                  <FormField
                    name='year'
                    control={methods.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.salaries.create.year')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={2000}
                            max={2200}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Employer Contribution */}
                  <FormField
                    name='employer_contribution'
                    control={methods.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.salaries.create.employer_contribution')}
                        </FormLabel>
                        <FormControl>
                          <Input type='number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Employee Contribution */}
                  <FormField
                    name='employee_contribution'
                    control={methods.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.salaries.create.employee_contribution')}
                        </FormLabel>
                        <FormControl>
                          <Input type='number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Net Salary */}
                  <FormField
                    name='net_salary'
                    control={methods.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.salaries.create.net_salary')}
                        </FormLabel>
                        <FormControl>
                          <Input type='number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tax */}
                  <FormField
                    name='tax'
                    control={methods.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.salaries.create.tax')}
                        </FormLabel>
                        <FormControl>
                          <Input type='number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* PDF File Upload */}
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm sm:p-6'>
                <h3 className='text-lg font-medium'>{t('admin.salaries.create.document') || 'Document'}</h3>
                <SalaryFileUpload 
                  uploadedFile={uploadedFile}
                  setUploadedFile={setUploadedFile}
                  error={fileError}
                  setError={setFileError}
                />
              </section>
            </CardContent>

            <CardFooter className='flex flex-col-reverse justify-between gap-2 border-t pt-6 sm:flex-row'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                className='w-full sm:w-auto'
              >
                {t('common.cancel')}
              </Button>
              <Button type='submit' className='w-full sm:w-auto'>
                {t('common.submit')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
};

export default SalaryCreate;
