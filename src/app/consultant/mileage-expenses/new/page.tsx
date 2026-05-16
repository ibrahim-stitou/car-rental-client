'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { useLanguage } from '@/context/LanguageContext';

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const years = [
  { value: (currentYear - 3).toString(), label: (currentYear - 3).toString() },
  { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() },
  { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
  { value: currentYear.toString(), label: currentYear.toString() },
];

interface MissionOption {
  id: number;
  title: string;
}

const mileageExpenseSchema = (t: any) => z.object({
  mission_id: z.coerce.number({
    required_error: t('consultant.mileageExpenses.validation.mission_required') || "Please select a mission",
  }),
  month: z.string({
    required_error: t('consultant.mileageExpenses.validation.month_required') || "Please select a month",
  }),
  year: z.coerce.number({
    required_error: t('consultant.mileageExpenses.validation.year_required') || "Please select a year",
  }),
});
// @ts-ignore
type MileageExpenseValues = z.infer<typeof mileageExpenseSchema>;

export default function NewMileageExpenseDeclaration() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missionOptions, setMissionOptions] = useState<MissionOption[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);

  // @ts-ignore
  const form = useForm<MileageExpenseValues>({
    resolver: zodResolver(mileageExpenseSchema(t)),
    defaultValues: {
      mission_id: undefined,
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear(),
    },
  });

  useEffect(() => {
    const fetchMissionOptions = async () => {
      setIsLoadingMissions(true);
      try {
        const response = await apiClient.get(apiRoutes.consultant.missions.selectOptions);
        if (response.data?.success && response.data.data) {
          setMissionOptions(response.data.data);
        } else {
          setMissionOptions([]);
          toast.error(t('consultant.mileageExpenses.errors.invalid_mission_data') || 'Invalid mission data format received');
        }
      } catch (error) {
        console.error('Failed to load missions:', error);
        toast.error(t('consultant.mileageExpenses.errors.load_missions_failed') || 'Failed to load missions');
        setMissionOptions([]);
      } finally {
        setIsLoadingMissions(false);
      }
    };

    fetchMissionOptions();
  }, [t]);

  const onSubmit = async (data: MileageExpenseValues) => {
    setIsSubmitting(true);
    try {
      // @ts-ignore
      const response = await apiClient.post(apiRoutes.consultant.mileageExpenses.create, { mission_id: data.mission_id, month: data.month, year: data.year, });

      if (response.data?.success && response.data?.expense_id) {
        toast.success(response.data.message || t('consultant.mileageExpenses.create.success') || 'Mileage expense created successfully.');
        router.push(`/consultant/mileage-expenses/${response.data.expense_id}`);
      } else {
        toast.error(response.data?.message || t('consultant.mileageExpenses.create.error') || 'Failed to create mileage expense.');
      }
    } catch (error) {
      toast.error(t('consultant.mileageExpenses.create.error_generic') || 'An error occurred while creating the mileage expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // @ts-ignore
  return (
    <PageContainer>
      <div className="space-y-4 w-full mx-auto">
        <div className="flex items-center justify-between">
          <Heading
            title={t('consultant.mileageExpenses.create.title') || "New Mileage Expense Declaration"}
            description={t('consultant.mileageExpenses.create.description') || "Start by selecting month, year, and mission"}
          />
          <Button
            variant="outline"
            onClick={() => router.push('/consultant/mileage-expenses')}
            className="h-8"
            size="sm"
          >
            {t('common.cancel') || "Cancel"}
          </Button>
        </div>
        <Separator />

        <Card>
          <CardContent className="pt-6">
            {/*//@ts-ignore*/}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    //@ts-ignore
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>{t('consultant.mileageExpenses.create.month') || "Month"}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t('consultant.mileageExpenses.create.monthSelect') || "Select month"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {t(`months.${month.value}`) || month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    //@ts-ignore
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>{t('consultant.mileageExpenses.create.year') || "Year"}</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t('consultant.mileageExpenses.create.yearSelect') || "Select year"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year.value} value={year.value}>
                                {year.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    //@ts-ignore
                    control={form.control}
                    //@ts-ignore
                    name="mission_id"
                    render={({ field }) => (
                      <FormItem className="w-full md:col-span-2">
                        <FormLabel>{t('consultant.mileageExpenses.create.mission') || "Mission"}</FormLabel>
                        <Select
                          disabled={isLoadingMissions}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              {isLoadingMissions ? (
                                <div className="flex items-center space-x-2">
                                  <span>{t('dataTable.loading') || "Loading..."}</span>
                                </div>
                              ) : (
                                <SelectValue placeholder={t('consultant.mileageExpenses.create.missionSelect') || "Select mission"} />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingMissions ? (
                              Array(3).fill(0).map((_, i) => (
                                <div key={i} className="flex items-center px-2 py-1.5 space-x-2">
                                  <Skeleton className="h-4 w-full" />
                                </div>
                              ))
                            ) : missionOptions.length > 0 ? (
                              missionOptions.map((mission) => (
                                <SelectItem key={mission.id} value={mission.id.toString()}>
                                  {mission.title}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                                {t('consultant.mileageExpenses.create.no_missions') || "No missions available"}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="flex gap-1">
                          <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="h-1 w-1 rounded-full bg-white animate-bounce"></div>
                        </div>
                        <span className="ml-2">{t('consultant.mileageExpenses.create.creating') || "Creating..."}</span>
                      </>
                    ) : (
                      t('consultant.mileageExpenses.create.continue') || "Continue to Add Mileage Expenses"
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