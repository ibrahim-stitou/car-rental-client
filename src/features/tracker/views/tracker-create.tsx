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
import TrackerLabelSelect from '@/features/tracker/components/label-select';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { PATHS } from '@/config/paths';
import { useRouter } from 'next/navigation';


const TrackerCreate = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const trackerSchema = z.object({
    label: z.string().min(1, { message: 'Label is required' }),
    credit: z
      .string()
      .refine(
        (val) =>
          /^\d+$/.test(val) && parseInt(val) >= 0 && parseInt(val) <= 999999999,
        {
          message: 'Year must be a number between 0 and 999999999'
        }
      ),
    debit: z
      .string()
      .refine(
        (val) =>
          /^\d+$/.test(val) && parseInt(val) >= 0 && parseInt(val) <= 999999999,
        {
          message: 'Year must be a number between 0 and 999999999'
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
    accountable: z.boolean().optional()
  });
  const methods = useForm({
    resolver: zodResolver(trackerSchema),
    defaultValues: {
      label: '',
      credit: '0',
      debit: '0',
      consultant: '',
      month: '',
      year: '2000',
      accountable: false
    }
  });

  const onSubmit = async (data: z.infer<typeof trackerSchema>) => {
    apiClient
      .post(apiRoutes.admin.trackers.create, data)
      .then((response) => {
        toast.success(response.data.message);
        router.push(PATHS.admin.trackers.list.link);
      })
      .catch((error) => {
        if (error instanceof AxiosError && error.response?.status === 422) {
          const errorData = error.response.data;
          // Laravel validation errors are typically in the 'errors' key
          if (errorData?.errors) {
            Object.keys(errorData.errors).forEach((fieldName) => {
              const messages = errorData.errors[fieldName];
              if (messages && messages.length > 0) {
                methods.setError(
                  fieldName as keyof z.infer<typeof trackerSchema>,
                  {
                    type: 'server',
                    message: messages.join(', ')
                  }
                );
              }
            });
          } else if (errorData?.message) {
            toast.error(errorData.message);
          } else {
            toast.error(errorData);
          }
        } else {
          toast.error('An error occurred while creating the tracker.');
        }
      });
  };

  return (
    <PageContainer>
      <div className='h-full w-full space-y-4 overflow-auto bg-gray-50 p-3'>
        <div className='flex items-start justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('admin.trackers.create.title')}
          </h1>
        </div>
        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className='space-y-2'>
            <CardContent className='space-y-6 pt-4'>
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <TrackerLabelSelect
                    name='label'
                    form={methods}
                    label={t('admin.trackers.create.label')}
                    placeholder={t('admin.trackers.create.labelSelect')}
                    required
                  />

                  <FormField
                    control={methods.control}
                    name='credit'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.trackers.create.credit')}
                        </FormLabel>
                        <FormControl>
                          <Input type='number' {...field} placeholder='' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={methods.control}
                    name='debit'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.trackers.create.debit')}
                        </FormLabel>
                        <FormControl>
                          <Input type='number' {...field} placeholder='' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <ConsultantSelect
                    name='consultant'
                    form={methods}
                    label={t('admin.trackers.create.consultant')}
                    placeholder={t('admin.trackers.create.consultantSelect')}
                    required
                  />
                  <FormField
                    name='month'
                    control={methods.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.trackers.create.month')}
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className='w-full'>
                              <SelectValue
                                placeholder={t(
                                  'admin.trackers.create.monthSelect'
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
                  <FormField
                    name='year'
                    control={methods.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.trackers.create.year')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={2000}
                            max={2200}
                            {...field}
                            placeholder=''
                            onChange={(e) => field.onChange(e.target.value)} // Ensure value is passed as string
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={methods.control}
                    name='accountable'
                    render={({ field }) => (
                      <FormItem className='flex items-center space-x-2'>
                        {' '}
                        {/* Added flex layout */}
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id='accountable'
                          />
                        </FormControl>
                        <FormLabel htmlFor='accountable' aria-required='true'>
                          {t('admin.trackers.create.accountable')}
                        </FormLabel>
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
              >
                {t('common.cancel')}
              </Button>
              <Button type='submit'>{t('common.submit')}</Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
};

export default TrackerCreate;
