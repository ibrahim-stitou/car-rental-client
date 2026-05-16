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

// Generate month options
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

// Generate year options (current year and 3 years before)
const currentYear = new Date().getFullYear();
const years = [
  { value: (currentYear - 3).toString(), label: (currentYear - 3).toString() },
  { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() },
  { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
  { value: currentYear.toString(), label: currentYear.toString() },
];

// Interface for mission options
interface MissionOption {
  id: number;
  title: string;
}


//@ts-ignore
type ExpenseDeclarationValues = z.infer<typeof expenseDeclarationSchema>;

export default function NewExpenseDeclaration() {
  const router = useRouter();
  const { t } = useLanguage();
  const expenseDeclarationSchema = z.object({
    mission_id: z.coerce.number({
      required_error: t('consultant.expenses.create.mission_required') || "Please select a mission",
    }),
    month: z.string({
      required_error: t('consultant.expenses.create.month_required') || "Please select a month",
    }),
    year: z.coerce.number({
      required_error: t('consultant.expenses.create.year_required') || "Please select a year",
    }),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missionOptions, setMissionOptions] = useState<MissionOption[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);

  // Form for month, year, and mission selection
  const form = useForm<ExpenseDeclarationValues>({
    resolver: zodResolver(expenseDeclarationSchema),
    defaultValues: {
      mission_id: undefined,
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear(),
    },
  });

  // Fetch missions for select options
  useEffect(() => {
    const fetchMissionOptions = async () => {
      setIsLoadingMissions(true);
      try {
        const response = await apiClient.get(apiRoutes.consultant.missions.selectOptions);
        if (response.data?.success && response.data.data) {
          setMissionOptions(response.data.data);
        } else {
          setMissionOptions([]);
          toast.error(t('consultant.expenses.errors.invalid_mission_data') || 'Invalid mission data format received');
        }
      } catch (error) {
        console.error('Failed to load missions:', error);
        toast.error(t('consultant.expenses.errors.load_missions_failed') || 'Failed to load missions');
        setMissionOptions([]);
      } finally {
        setIsLoadingMissions(false);
      }
    };

    fetchMissionOptions();
  }, [t]);

  // Handle form submission
  const onSubmit = async (data: ExpenseDeclarationValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiClient.post(apiRoutes.consultant.expenses.initialise, {
        mission_id: data.mission_id,
        month: data.month,
        year: data.year
      });

      if (response.data?.success && response.data?.expense_id) {
        toast.success(response.data.message || t('consultant.expenses.create.success') || 'Expense declaration created successfully.');
        router.push(`/consultant/expenses/${response.data.expense_id}`);
      } else {
        toast.error(response.data?.message || t('consultant.expenses.create.error') || 'Failed to create expense declaration.');
      }
    } catch (error) {
      toast.error(t('consultant.expenses.create.error_generic') || 'An error occurred while creating the expense declaration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer >
      <div className="space-y-4 w-full  mx-auto">
        <div className="flex items-center justify-between">
          <Heading
            title={t('consultant.expenses.create.title') || "New Expense Declaration"}
            description={t('consultant.expenses.create.description') || "Start by selecting month, year and mission"}
          />
          <Button
            variant="outline"
            onClick={() => router.push('/consultant/expenses')}
            className="h-8"
            size="sm"
          >
            {t('common.cancel') || "Cancel"}
          </Button>
        </div>
        <Separator />

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Month Select Field */}
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>{t('consultant.expenses.create.month') || "Month"}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t('consultant.expenses.create.monthSelect') || "Select month"} />
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

                  {/* Year Select Field */}
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>{t('consultant.expenses.create.year') || "Year"}</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t('consultant.expenses.create.yearSelect') || "Select year"} />
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

                  {/* Missions Select Field - Full Width */}
                  <FormField
                    control={form.control}
                    name="mission_id"
                    render={({ field }) => (
                      <FormItem className="w-full md:col-span-2">
                        <FormLabel>{t('consultant.expenses.create.mission') || "Mission"}</FormLabel>
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
                                <SelectValue placeholder={t('consultant.expenses.create.missionSelect') || "Select mission"} />
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
                                {t('consultant.expenses.create.no_missions') || "No missions available"}
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
                        <span className="ml-2">{t('consultant.expenses.create.creating') || "Creating..."}</span>
                      </>
                    ) : (
                      t('consultant.expenses.create.continue') || "Continue to Add Expenses"
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