'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import {
  IconCalendar,
  IconFileText,
  IconBriefcase,
  IconClock,
  IconArrowBack,
  IconAlertCircle,
} from '@tabler/icons-react';

import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useLanguage } from '@/context/LanguageContext';
import { ConsultantTimesheet } from '@/stores/consultant/timesheet-store';
import { format, getDaysInMonth, isWeekend, addDays, startOfMonth, getDay } from 'date-fns';

interface TimesheetMedia {
  id: number;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  original_url: string;
  preview_url: string;
}

interface TimesheetRejection {
  id: number;
  rejectable_type: string;
  rejectable_id: number;
  user_id: number;
  reason: string;
  metadata: any[];
  created_at: string;
  updated_at: string;
}

interface TimesheetPointage {
  id: number;
  timesheet_id: number;
  date: string;
  status: 'worked' | 'absent' | 'weekend' | 'daysoff' | 'none';
  created_at: string;
  updated_at: string;
}

interface TimesheetDetail extends ConsultantTimesheet {
  media?: TimesheetMedia[];
  rejections?: TimesheetRejection[];
  pointages?: TimesheetPointage[];
}

interface TimesheetResponse {
  success: boolean;
  data: {
    timesheet: TimesheetDetail;
  };
}

const monthName = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return `${day} ${monthName[monthIndex]} ${year}`;
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day} ${monthName[monthIndex]} ${year}, ${hours}:${minutes}`;
};

const getStatusVariant = (status: string): "outline" | "secondary" | "destructive" | "default" | null | undefined => {
  switch (status) {
    case 'draft': return 'outline';
    case 'review': return 'secondary';
    case 'rejected': return 'destructive';
    case 'approved': return 'default';
    default: return 'default';
  }
};

function MonthlyTimesheetView({ selectedMonth, year, pointages = [] }: {
  selectedMonth: string,
  year: number,
  pointages?: TimesheetPointage[]
}) {
  const { t } = useLanguage();
  const [daysStatus, setDaysStatus] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({
    worked: 0,
    absent: 0,
    weekend: 0,
    vacation: 0,
    daysoff: 0,
  });

  useEffect(() => {
    const pointageMap: Record<string, string> = {};
    let statCounts = {
      worked: 0,
      absent: 0,
      weekend: 0,
      vacation: 0,
      daysoff: 0,
    };

    pointages.forEach(pointage => {
      const dateKey = pointage.date.substring(0, 10);
      pointageMap[dateKey] = pointage.status;
      //@ts-ignore
      if (statCounts[pointage.status] !== undefined) {statCounts[pointage.status]++;}
    });

    setDaysStatus(pointageMap);
    setStats(statCounts);
  }, [pointages]);

  const renderDays = () => {
    const days = [];
    const monthIndex = parseInt(selectedMonth) - 1;
    const firstDay = startOfMonth(new Date(year, monthIndex));
    const daysInMonth = getDaysInMonth(new Date(year, monthIndex));
    const dayNames = [t('common.monday'), t('common.tuesday'), t('common.wednesday'), t('common.thursday'), t('common.friday'), t('common.saturday'), t('common.sunday')];

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
      const status = daysStatus[dayKey] || 'none';
      let bgColor = 'bg-white';
      let textColor = '';
      let borderColor = 'border-gray-100';
      if (status === 'worked') {
        bgColor = 'bg-purple-500';
        textColor = 'text-white';
      } else if (status === 'absent') {
        bgColor = 'bg-amber-500';
        textColor = 'text-white';
      } else if (status === 'daysoff') {
        bgColor = 'bg-gray-300';
        borderColor = 'border-gray-300';
      } else if (status === 'weekend') {
        bgColor = 'bg-gray-200';
        borderColor = 'border-gray-200';
      }

      days.push(
        <TooltipProvider key={dayKey}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`h-12 w-full flex items-center justify-center ${bgColor} border ${borderColor} rounded-md transition-colors`}
              >
                <span className={`font-medium ${textColor}`}>{dayNum}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {status === 'worked' ? t('timesheet.status.worked') :
                status === 'absent' ? t('timesheet.status.absent') :
                  status === 'vacation' ? t('timesheet.status.vacation') :
                    status === 'daysoff' ? t('timesheet.status.daysoff') :
                      status === 'weekend' ? t('timesheet.status.weekend') : t('timesheet.status.not_specified')}
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
            <span>{t('timesheet.stats.worked')}: {stats.worked}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>{t('timesheet.stats.absent')}: {stats.absent}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>{t('timesheet.stats.daysoff')}: {stats.daysoff}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span>{t('timesheet.stats.weekend')}: {stats.weekend}</span>
          </Badge>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 border rounded-md p-2">
          {renderDays()}
        </div>
      </div>
    </div>
  );
}

function TimesheetViewContent({ timesheetId }: { timesheetId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [timesheet, setTimesheet] = useState<TimesheetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCorrectingTimesheet, setIsCorrectingTimesheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimesheet = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get<TimesheetResponse>(
          apiRoutes.consultant.timesheets.detail(timesheetId)
        );

        if (response.data && response.data.success) {
          setTimesheet(response.data.data.timesheet);
        } else {
          setError(t('timesheet.error.load_failed'));
          toast.error(t('timesheet.error.load_failed'));
        }
      } catch (err) {
        console.error('Error fetching timesheet:', err);
        setError(t('timesheet.error.load_failed'));
        toast.error(t('timesheet.error.load_failed'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimesheet();
  }, [timesheetId, t]);

  const handleCorrectTimesheet = () => {
    setIsCorrectingTimesheet(true);
    toast.success(t('timesheet.correct.redirecting'));
    router.push(`/consultant/timesheets/${timesheetId}/correct`);
    setIsCorrectingTimesheet(false);
  };

  const formatTimesheetPeriod = () => {
    if (!timesheet) return '';
    return `${monthName[Number(timesheet.month) - 1]} ${timesheet.year}`;
  };

  // Calculate work stats from pointages
  const calculateWorkStats = () => {
    if (!timesheet?.pointages) return { workDays: 0, absenceDays: 0};

    const workDays = timesheet.pointages.filter(p => p.status === 'worked').length;
    const absenceDays = timesheet.pointages.filter(p => p.status === 'absent').length;
    return { workDays, absenceDays };
  };

  const { workDays, absenceDays } = calculateWorkStats();

  return (
    <PageContainer>
      <div className="space-y-5 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heading
              title={t('timesheet.details.title')}
              description={t('timesheet.details.description')}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="h-9"
              size="sm"
            >
              <IconArrowBack className="mr-2 h-4 w-4" /> {t('common.back')}
            </Button>
            {timesheet?.status === 'rejected' && (
              <Button
                onClick={handleCorrectTimesheet}
                className="h-9"
                size="sm"
                disabled={isCorrectingTimesheet}
              >
                {isCorrectingTimesheet ? t('timesheet.correct.processing') : t('timesheet.correct.button')}
              </Button>
            )}
          </div>
        </div>
        <Separator />

        {isLoading ? (
          <TimesheetDetailSkeleton />
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center text-destructive space-y-2">
                <p className="font-medium">{error}</p>
                <Button variant="outline" onClick={() => router.back()}>
                  {t('common.go_back')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : timesheet ? (
          <div className="grid gap-4">
            <Card className="overflow-hidden border shadow-sm pt-0">
              <div className="bg-primary/5 px-6 py-5 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <IconCalendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">
                        {t('timesheet.title')} - {formatTimesheetPeriod()}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm">
                        {t('timesheet.submitted_on')} {formatDate(timesheet.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    className="capitalize px-3 py-1.5 text-sm font-medium"
                    variant={getStatusVariant(timesheet.status)}
                  >
                    {timesheet.status === 'review' ? t('admin.timesheets.status.review') :
                      timesheet.status === 'rejected' ? t('admin.timesheets.status.rejected') :
                        //@ts-ignore
                        timesheet.status === 'approved' ? t('admin.timesheets.status.approved') :
                          timesheet.status === 'validated' ? t('admin.timesheets.status.validated') :
                          timesheet.status === 'draft' ? t('consultant.timesheets.show.status.draft') : t('timesheets.status.unknown')}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 py-5">
                <div className="grid gap-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-slate-50 rounded-xl shadow-sm p-5 border border-primary/30 transition-all">
                      <div className="flex items-center gap-2 text-primary mb-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <IconBriefcase className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold">{t('timesheet.mission_details')}</h3>
                      </div>
                      <div className="ml-1">
                        <p className="text-sm text-muted-foreground mb-1">{t('timesheet.mission_title')}</p>
                        <p className="font-medium text-lg">{timesheet.mission?.title || t('common.no_data')}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl shadow-sm p-5 border border-primary/30 transition-all">
                      <div className="flex items-center gap-2 text-primary mb-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <IconClock className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold">{t('timesheet.work_summary')}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-3 rounded-md border text-center">
                          <p className="text-xs text-muted-foreground">{t('timesheet.stats.worked')}</p>
                          <p className="text-lg font-semibold text-purple-500">{workDays}</p>
                        </div>
                        <div className="bg-white p-3 rounded-md border text-center">
                          <p className="text-xs text-muted-foreground">{t('timesheet.stats.absent')}</p>
                          <p className="text-lg font-semibold text-amber-500">{absenceDays}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Calendar View */}
                  <Card className="shadow-sm border">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <IconCalendar className="h-5 w-5 text-primary" />
                        {t('timesheet.calendar.title')}
                      </CardTitle>
                      <CardDescription>
                        {t('timesheet.calendar.description')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <MonthlyTimesheetView
                        selectedMonth={timesheet.month}
                        year={timesheet.year}
                        pointages={timesheet.pointages}
                      />
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {timesheet.status === 'rejected' && timesheet.rejections && timesheet.rejections.length > 0 && (
              <Card className="shadow-sm border-destructive/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <IconAlertCircle className="h-5 w-5" />
                    {t('timesheet.rejection_reasons.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('timesheet.rejection_reasons.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="divide-y">
                    {timesheet.rejections.map((rejection) => (
                      <div key={rejection.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-destructive">{rejection.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(rejection.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {timesheet.media && timesheet.media.length > 0 ? (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <IconFileText className="h-5 w-5 text-primary" />
                    {t('timesheet.supporting_documents.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('timesheet.supporting_documents.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {timesheet.media.map((file) => (
                    <div key={file.id} className="border rounded-lg overflow-hidden">
                      {file.mime_type === 'application/pdf' && (
                        <div className="border-t">
                          <iframe
                            src={file.original_url}
                            className="w-full h-[500px]"
                            title={file.name || t('timesheet.supporting_documents.default_title')}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <IconFileText className="h-5 w-5 text-primary" />
                    {t('timesheet.supporting_documents.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 py-8">
                  <div className="text-center text-muted-foreground">
                    <p>{t('timesheet.supporting_documents.no_documents')}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">{t('timesheet.error.no_timesheet_found')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
function TimesheetDetailSkeleton() {
  return (
    <div className="grid gap-5">
      <Card className="overflow-hidden border shadow-sm">
        <div className="bg-primary/5 px-6 py-5 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div>
                <Skeleton className="h-6 w-64 mb-1" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        <CardContent className="pt-5 pb-6">
          <div className="grid gap-5 md:grid-cols-2">
            {Array(2).fill(0).map((_, i) => (
              <div key={i} className="bg-muted/20 rounded-lg p-5 border">
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-3">
                  <div>
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar skeleton */}
          <div className="mt-5">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72 mb-4" />
            <div className="grid grid-cols-7 gap-1">
              {Array(7).fill(0).map((_, i) => (
                <Skeleton key={`header-${i}`} className="h-6 w-full" />
              ))}
              {Array(35).fill(0).map((_, i) => (
                <Skeleton key={`day-${i}`} className="h-12 w-full rounded-md" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function TimesheetView({ params }: { params: Promise<{ timesheetId: string }> }) {
  const resolvedParams = React.use(params);
  return <TimesheetViewContent timesheetId={resolvedParams.timesheetId} />;
}