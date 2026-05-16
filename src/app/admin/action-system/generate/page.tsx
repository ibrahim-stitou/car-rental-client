'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { Calendar, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api';
import PageContainer from '@/components/layout/page-container';
import { useRouter } from 'next/navigation';
import { apiRoutes } from '@/config/apiRoutes';
import { useLanguage } from '@/context/LanguageContext';

const formSchema = z.object({
  action_type: z.string().min(1, 'Action type is required'),
  month: z.string().min(1, 'Month is required'),
  year: z.string().min(4, 'Year is required').max(4, 'Year must be 4 digits')
});

type FormValues = z.infer<typeof formSchema>;

export default function SystemActionsPage() {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      action_type: '',
      month: '',
      year: ''
    }
  });
  const router = useRouter();

  const handleFormSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      let apiEndpoint;
        apiEndpoint = apiRoutes.admin.systemAction.generate;


      const response = await apiClient.post(apiEndpoint, {
        action_type: data.action_type,
        month: parseInt(data.month, 10),
        year: parseInt(data.year, 10)
      });

      if (response.status === 200) {
        toast.success(t('admin.system-actions.generate.success'), {
          description: `${t('months.' + data.month)} ${data.year}`
        });

        form.reset();
        setTimeout(() => {
          router.push('/admin/action-system');
        }, 500);
      }
    } catch (error) {
      toast.error(t('admin.system-actions.generate.error'), {
        description:
          error instanceof Error ? error.message : t('common.error.try_again')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionTypes = [
    { value: 'flat_fees', label: t('admin.system-actions.types.flat_fees') },
    { value: 'insurance', label: t('admin.system-actions.types.insurance') },
    { value: 'tresieme_mois', label: t('admin.system-actions.types.tresieme_mois') },
    { value: 'cheque_repas', label: t('admin.system-actions.types.cheque_repas') }

  ];

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString();
    return { value: month, label: t(`months.${month}`) };
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }));

  return (
    <PageContainer>
      <div className='w-full space-y-6'>
        <div className='flex items-start justify-between gap-4'>
          <div className='space-y-2'>
            <Heading
              title={t('admin.system-actions.generate.title')}
              description={t('admin.system-actions.generate.description')}
            />
          </div>
        </div>

        <Separator className='my-4' />

        <div className='grid gap-6'>
          <Card className='border-primary py-0 pb-3'>
            <CardHeader className='bg-muted/50 py-2'>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                <span>{t('admin.system-actions.generate.action_generation')}</span>
              </CardTitle>
              <CardDescription>
                {t('admin.system-actions.generate.select_instruction')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleFormSubmit)}
                  className='space-y-6'
                >
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                    {/* Action Type Selector */}
                    <FormField
                      control={form.control}
                      name='action_type'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.system-actions.table.action_type')}</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger className='h-12 w-full'>
                                <SelectValue placeholder={t('admin.system-actions.generate.select_action')} />
                              </SelectTrigger>
                              <SelectContent>
                                {actionTypes.map((action) => (
                                  <SelectItem
                                    key={action.value}
                                    value={action.value}
                                  >
                                    {action.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Month Selector */}
                    <FormField
                      control={form.control}
                      name='month'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.system-actions.table.month')}</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger className='h-12 w-full'>
                                <SelectValue placeholder={t('admin.system-actions.generate.select_month')} />
                              </SelectTrigger>
                              <SelectContent>
                                {months.map((month) => (
                                  <SelectItem
                                    key={month.value}
                                    value={month.value}
                                  >
                                    {month.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Year Selector */}
                    <FormField
                      control={form.control}
                      name='year'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.system-actions.table.year')}</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger className='h-12 w-full'>
                                <SelectValue placeholder={t('admin.system-actions.generate.select_year')} />
                              </SelectTrigger>
                              <SelectContent>
                                {years.map((year) => (
                                  <SelectItem
                                    key={year.value}
                                    value={year.value}
                                  >
                                    {year.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='flex justify-end gap-4 pt-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => form.reset()}
                      disabled={isSubmitting}
                    >
                      {t('admin.system-actions.clear')}
                    </Button>
                    <Button
                      type='submit'
                      disabled={isSubmitting || !form.formState.isDirty}
                      className='min-w-[150px]'
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          {t('admin.system-actions.generate.generating')}
                        </>
                      ) : (
                        t('admin.system-actions.generate_')
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className='bg-muted/50'>
            <CardHeader>
              <CardTitle className='text-lg'>{t('admin.system-actions.generate.notes_title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='text-muted-foreground list-disc space-y-2 pl-5 text-sm'>
                <li>
                  {t('admin.system-actions.generate.note_1')}
                </li>
                <li>
                  {t('admin.system-actions.generate.note_2')}
                </li>
                <li>
                  {t('admin.system-actions.generate.note_3')}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}