'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useConsultantTimesheetStore } from '@/stores/consultant/timesheet-store';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { IconCalendar, IconCheck, IconFileText } from '@tabler/icons-react';
import { Heading } from '@/components/ui/heading';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { SingleFileUpload, UploadedFile } from '@/components/custom/singlefile-upload';
import { format, getDaysInMonth, isWeekend, addDays, startOfMonth, getDay } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/context/LanguageContext';

type DayStatus = 'worked' | 'absent' | 'weekend' | 'daysoff' | 'none';

interface MonthlyTimesheetProps {
  selectedMonth: Date;
  daysOff?: string[];
  onDaysChange?: (days: Record<string, string>) => void;
  showValidationErrors?: boolean;
  submissionAttempted?: boolean;
}

function MonthlyTimesheet({
                            selectedMonth,
                            daysOff = [],
                            onDaysChange,
                            showValidationErrors = false,
                            submissionAttempted = false,
                          }: MonthlyTimesheetProps) {
  const { t } = useLanguage();
  const [daysStatus, setDaysStatus] = useState<Record<string, DayStatus>>({});
  const [stats, setStats] = useState({
    worked: 0,
    absent: 0,
    weekend: 0,
    daysoff: 0,
    none: 0,
  });

  useEffect(() => {
    const initialDaysStatus: Record<string, DayStatus> = {};
    const firstDay = startOfMonth(selectedMonth);
    const daysInMonth = getDaysInMonth(selectedMonth);

    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = addDays(firstDay, i);
      const dayKey = format(currentDate, 'yyyy-MM-dd');

      if (isWeekend(currentDate)) {
        initialDaysStatus[dayKey] = 'weekend';
      } else if (daysOff.includes(dayKey)) {
        initialDaysStatus[dayKey] = 'daysoff';
      } else {
        initialDaysStatus[dayKey] = 'none';
      }
    }

    setDaysStatus(initialDaysStatus);
  }, [selectedMonth, daysOff]);

  useEffect(() => {
    const newStats = Object.values(daysStatus).reduce(
      (acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { worked: 0, absent: 0, weekend: 0, daysoff: 0, none: 0 }
    );

    setStats(newStats);

    if (onDaysChange && Object.keys(daysStatus).length > 0) {
      onDaysChange(daysStatus);
    }
  }, [daysStatus, onDaysChange]);

  const toggleDayStatus = (day: string) => {
    setDaysStatus((prevDaysStatus) => {
      const currentStatus = prevDaysStatus[day];

      if (currentStatus === 'weekend' || currentStatus === 'daysoff') {
        return prevDaysStatus;
      }

      const statusOrder: DayStatus[] = ['none', 'worked', 'absent'];
      let currentIndex = statusOrder.indexOf(currentStatus);
      if (currentIndex === -1) currentIndex = 0;

      const nextIndex = (currentIndex + 1) % statusOrder.length;
      const newStatusValue = statusOrder[nextIndex];

      return {
        ...prevDaysStatus,
        [day]: newStatusValue,
      };
    });
  };

  const renderDays = () => {
    const days = [];
    const firstDay = startOfMonth(selectedMonth);
    const daysInMonth = getDaysInMonth(selectedMonth);
    // Using translation keys for day names

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day =>
      t(`consultant.timesheets.show.calendar.${day.toLowerCase()}`)
    );

    dayNames.forEach((dayName) => {
      days.push(
        <div key={`header-${dayName}`} className="text-center font-medium text-sm py-2">
          {dayName}
        </div>
      );
    });

    const firstDayOfWeek = getDay(firstDay);
    const emptyDays = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);
    for (let i = 0; i < emptyDays; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 border border-transparent"></div>);
    }

    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = addDays(firstDay, i);
      const dayKey = format(currentDate, 'yyyy-MM-dd');
      const dayNum = format(currentDate, 'd');
      const isWeekendDay = isWeekend(currentDate);
      const isDayOff = daysOff.includes(dayKey);
      const status = daysStatus[dayKey] || 'none';

      let bgColor = 'bg-white';
      let hoverEffect = 'hover:bg-purple-100';
      let textColor = '';
      let borderColor = 'border-gray-100';

      if (status === 'worked') {
        bgColor = 'bg-purple-500';
        hoverEffect = 'hover:bg-purple-600';
        textColor = 'text-white';
      } else if (status === 'absent') {
        bgColor = 'bg-amber-500';
        hoverEffect = 'hover:bg-amber-600';
        textColor = 'text-white';
      }  else if (isDayOff) {
        bgColor = 'bg-gray-300';
        hoverEffect = '';
        borderColor = 'border-gray-300';
      } else if (isWeekendDay) {
        bgColor = 'bg-gray-200';
        hoverEffect = '';
        borderColor = 'border-gray-200';
      } else if (status === 'none' && submissionAttempted) {
        bgColor = 'bg-red-100';
        borderColor = 'border-red-300';
        hoverEffect = 'hover:bg-red-200';
      }

      days.push(
        <TooltipProvider key={dayKey}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={() => !isWeekendDay && !isDayOff && toggleDayStatus(dayKey)}
                className={`h-12 w-full flex items-center justify-center ${bgColor} ${hoverEffect} border ${borderColor} rounded-md transition-colors ${!isWeekendDay && !isDayOff ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <span className={`font-medium ${textColor}`}>{dayNum}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isWeekendDay
                ? t('consultant.timesheets.show.weekend')
                : isDayOff
                  ? t('consultant.timesheets.show.daysoff')
                  : status === 'worked'
                    ? t('consultant.timesheets.show.worked')
                    : status === 'absent'
                      ? t('consultant.timesheets.show.absent')
                        : (submissionAttempted ? t('consultant.timesheets.show.notSpecified') + ' ⚠️' : t('consultant.timesheets.show.notSpecified'))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return days;
  };

  return (
    <div className="w-full mx-auto p-0">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mt-1 mb-0">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>{t('consultant.timesheets.show.worked')}: {stats.worked}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>{t('consultant.timesheets.show.absent')}: {stats.absent}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>{t('consultant.timesheets.show.daysoff')}: {stats.daysoff}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span>{t('consultant.timesheets.show.weekend')}: {stats.weekend}</span>
          </Badge>
          {stats.none > 0 && (
            <Badge
              variant="outline"
              className={`flex items-center gap-1 ${showValidationErrors ? 'border-red-500 text-red-500' : ''}`}
            >
              <div className={`w-3 h-3 rounded-full ${showValidationErrors ? 'bg-red-500' : 'bg-gray-100'}`}></div>
              <span>{t('consultant.timesheets.show.notSpecified')}: {stats.none}</span>
            </Badge>
          )}
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 border rounded-md p-2">
          {renderDays()}
        </div>

        {showValidationErrors && stats.none > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>
              <strong>{t('common.attention')}:</strong> {t('consultant.timesheets.markAllWorkdays')}
              ({stats.none} {stats.none > 1 ? t('common.days') : t('common.day')} {t('consultant.timesheets.unmarked')}).
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewTimesheet() {
  const { t } = useLanguage();
  const router = useRouter();
  const [missionOptions, setMissionOptions] = useState<{ id: number; title: string }[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);
  const { addTimesheet, error, loading, clearError } = useConsultantTimesheetStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportingDocument, setSupportingDocument] = useState<UploadedFile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [publicHolidays, setPublicHolidays] = useState<string[]>([]);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => ({
    value: (currentYear - 3 + i).toString(),
    label: (currentYear - 3 + i).toString(),
  }));

  const formSchema = z.object({
    mission_id: z.number().min(1, t('consultant.timesheets.create.mission_required')),
    month: z.string().min(1, t('consultant.timesheets.create.month_required')),
    year: z.number().min(2000, t('consultant.timesheets.create.year_required')),
    supporting_document_path: z.string().optional(),
    days: z.record(z.enum(['worked', 'absent', 'weekend', 'daysoff', 'none'])),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mission_id: undefined,
      month: (new Date().getMonth() + 1).toString(),
      year: currentYear,
      supporting_document_path: '',
      days: {},
    },
  });

  const { watch, setValue, getValues } = form;
  const selectedMonth = watch('month');
  const selectedYear = watch('year');

  useEffect(() => {
    const fetchPublicHolidays = async () => {
      try {
        const response = await apiClient.get(apiRoutes.consultant.daysOff.list);
        if (response.data?.success) {
          const holidays = response.data.data.map((holiday: { date: string }) => holiday.date);
          setPublicHolidays(holidays);
        } else {
          toast.error(t('consultant.timesheets.errors.holidays_load'));
        }
      } catch (error) {
        console.error(t('consultant.timesheets.errors.holidays_load_failed'), error);
        toast.error(t('consultant.timesheets.errors.holidays_load'));
      }
    };

    fetchPublicHolidays();
  }, [t]);

  useEffect(() => {
    const newDate = new Date(parseInt(selectedYear.toString()), parseInt(selectedMonth) - 1, 1);
    setSelectedDate(newDate);
    if (Object.keys(getValues('days')).length > 0) {
      setValue('days', {}, { shouldValidate: false });
      setShowValidationErrors(false);
    }
  }, [selectedMonth, selectedYear, getValues, setValue]);

  const handleFileChange = (file: UploadedFile | null) => {
    setSupportingDocument(file);
    setValue('supporting_document_path', file?.path || '', { shouldValidate: true });
  };

  useEffect(() => {
    const fetchMissionOptions = async () => {
      setIsLoadingMissions(true);
      try {
        const response = await apiClient.get(apiRoutes.consultant.missions.selectOptions);
        if (response.data?.success && Array.isArray(response.data.data)) {
          setMissionOptions(response.data.data);
        } else {
          toast.error(t('consultant.timesheets.errors.missions_format'));
        }
      } catch (error) {
        console.error(t('consultant.timesheets.errors.missions_load_failed'), error);
        toast.error(t('consultant.timesheets.errors.missions_load'));
      } finally {
        setIsLoadingMissions(false);
      }
    };
    fetchMissionOptions();
  }, [t]);

  const handleDaysChange = (days: Record<string, string>) => {
    setValue('days', days as Record<string, 'worked' | 'absent' | 'weekend' | 'daysoff' | 'none'>,
      { shouldValidate: true });
    setShowValidationErrors(false);
  };

  const handleFormSubmit = async (data: FormValues) => {
    clearError();
    setIsSubmitting(true);
    setSubmissionAttempted(true);
    const unmarkedDays = Object.entries(data.days).filter(([_, status]) => status === 'none');
    if (unmarkedDays.length > 0) {
      toast.error(t('consultant.timesheets.errors.unmarked_days'));
      setShowValidationErrors(true);
      setIsSubmitting(false);
      return;
    }
    const workingDays = Object.entries(data.days).filter(([_, status]) => status === 'worked');


    try {
      const result = await addTimesheet({
        mission_id: data.mission_id,
        month: data.month,
        year: data.year,
        status: 'draft',
        supporting_document_path: data.supporting_document_path,
        days: data.days,
      });

      if (result) {
        toast.success(t('consultant.timesheets.create.success'));
        router.push('/consultant/timesheets');
      } else {
        toast.error(error || t('consultant.timesheets.create.error'));
      }
    } catch (err) {
      toast.error(t('consultant.timesheets.create.error_general'));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between">
          <Heading
            title={t('consultant.timesheets.create.title')}
            description={t('consultant.timesheets.create.description')}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()} className="h-8" size="sm">
              {t('common.back')}
            </Button>
            <Badge variant="outline" className="bg-muted/50 h-8 flex items-center px-4 text-sm text-primary">
              {t(`months.${selectedMonth}`)} {selectedYear}
            </Badge>
          </div>
        </div>
        <Separator />
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-6">
            <IconCalendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('consultant.timesheets.create.declaration')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {t('consultant.timesheets.create.declaration_description')}
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <FormField
                    control={form.control}
                    name="mission_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('consultant.timesheets.create.mission')}</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={isLoadingMissions}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              {isLoadingMissions ? (
                                <div className="flex items-center w-full space-x-2">
                                  <Skeleton className="h-4 w-4 rounded-full" />
                                  <Skeleton className="h-4 w-full" />
                                </div>
                              ) : (
                                <SelectValue placeholder={t('consultant.timesheets.create.missionSelect')} />
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
                              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                {t('consultant.timesheets.create.no_missions')}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Month */}
                    <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('consultant.timesheets.create.month')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('consultant.timesheets.create.monthSelect')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => ({
                                value: (i + 1).toString(),
                                label: t(`months.${i + 1}`)
                              })).map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
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
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('consultant.timesheets.create.year')}</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('consultant.timesheets.create.yearSelect')} />
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
                  </div>
                </div>
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="supporting_document_path"
                    render={() => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <IconFileText className="h-4 w-4 text-primary" />
                          {t('consultant.timesheets.create.supporting_document')}
                        </FormLabel>
                        <SingleFileUpload
                          label=""
                          onFileChange={handleFileChange}
                          value={supportingDocument}
                          description={t('consultant.timesheets.create.upload_document')}
                          accept={{ "application/pdf": [".pdf"] }}
                          maxSize={5}
                          previewHeight="h-30"
                          disabled={isSubmitting}
                          collection="timesheet_supporting"
                        />
                        <FormDescription>
                          {t('consultant.timesheets.create.document_description')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={form.control}
                name="days"
                render={() => (
                  <FormItem>
                    <MonthlyTimesheet
                      selectedMonth={selectedDate}
                      daysOff={publicHolidays}
                      onDaysChange={handleDaysChange}
                      showValidationErrors={showValidationErrors}
                      submissionAttempted={submissionAttempted}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/consultant/timesheets')}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || isLoadingMissions || isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <span>{t('common.submitting')}</span>
                    </>
                  ) : (
                    <>
                      <IconCheck className="mr-2 h-4 w-4" /> {t('common.submit')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </PageContainer>
  );
}