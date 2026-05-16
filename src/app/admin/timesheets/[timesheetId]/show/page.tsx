'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
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
  IconCheck,
  IconUser,
  IconBuilding
} from '@tabler/icons-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { format, getDaysInMonth, isWeekend, addDays, startOfMonth, getDay } from 'date-fns';

interface Consultant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  status: string;
  full_name: string;
  profile_image_url: string;
}

interface Client {
  id: number;
  name: string;
  phone: string;
  mail: string;
  city: string;
}

interface Mission {
  id: number;
  title: string;
  client_id: number;
  user_id: number;
  status: string;
  tjm: string;
  tjm_type: string;
  date_debut: string;
  date_fin: string;
  description: string;
  client: Client;
}

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
  reason: string;
  created_at: string;
}

interface TimesheetPointage {
  id: number;
  timesheet_id: number;
  date: string;
  status: 'worked' | 'absent' | 'weekend'  | 'daysoff' | 'none';
  created_at: string;
  updated_at: string;
}

interface TimesheetDetail {
  id: number;
  month: string;
  year: number;
  user_id: number;
  status: string;
  mission_id: number;
  days_nbr: number;
  absense: number;
  created_at: string;
  updated_at: string;
  mission?: Mission;
  consultant?: Consultant;
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

const formatDate = (dateString: string, t: any): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const month = t(`months.${date.getMonth() + 1}`);
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatDateTime = (dateString: string, t: any): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const month = t(`months.${date.getMonth() + 1}`);
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
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

function MonthlyTimesheetView({ selectedMonth, year, pointages = [], t }: {
  selectedMonth: string,
  year: number,
  pointages?: TimesheetPointage[],
  t: any
}) {
  const [daysStatus, setDaysStatus] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({
    worked: 0,
    absent: 0,
    weekend: 0,
    daysoff: 0,
  });

  useEffect(() => {
    const pointageMap: Record<string, string> = {};
    let statCounts = {
      worked: 0,
      absent: 0,
      weekend: 0,
      daysoff: 0,
    };

    pointages.forEach(pointage => {
      const dateKey = pointage.date.substring(0, 10);
      pointageMap[dateKey] = pointage.status;
      if (statCounts[pointage.status as keyof typeof statCounts] !== undefined) {
        statCounts[pointage.status as keyof typeof statCounts]++;
      }
    });

    setDaysStatus(pointageMap);
    setStats(statCounts);
  }, [pointages]);

  const renderDays = () => {
    const days = [];
    const monthIndex = parseInt(selectedMonth) - 1;
    const firstDay = startOfMonth(new Date(year, monthIndex));
    const daysInMonth = getDaysInMonth(new Date(year, monthIndex));
    const dayNames = [t('common.simple_days.mon'), t('common.simple_days.tue'), t('common.simple_days.wed'), t('common.simple_days.thu'), t('common.simple_days.fri'), t('common.simple_days.sat'), t('common.simple_days.sun')];

    // Render headers
    dayNames.forEach((dayName) => {
      days.push(
        <div key={`header-${dayName}`} className="text-center font-medium text-sm py-2">
          {dayName}
        </div>
      );
    });

    const firstDayOfWeek = getDay(firstDay);
    const emptyDays = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);

    // Render empty days
    for (let i = 0; i < emptyDays; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 border border-transparent"></div>);
    }

    // Render actual days
    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = addDays(firstDay, i);
      const dayKey = format(currentDate, 'yyyy-MM-dd');
      const dayNum = format(currentDate, 'd');
      const status = daysStatus[dayKey] || 'none';

      // Determine styles based on status
      const { bgColor, textColor, borderColor } = getDayStyles(status);

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
              {getStatusLabel(status, t)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return days;
  };

  const getDayStyles = (status: string) => {
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

    return { bgColor, textColor, borderColor };
  };

  const getStatusLabel = (status: string, t: any) => {
    switch (status) {
      case 'worked': return t('admin.timesheets.show.worked');
      case 'absent': return t('admin.timesheets.show.absent');
      case 'daysoff': return t('admin.timesheets.show.daysoff');
      case 'weekend': return t('admin.timesheets.show.weekend');
      default: return t('admin.timesheets.show.notSpecified');
    }
  };

  return (
    <div className="w-full mx-auto p-0">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mt-1 mb-0">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>{t('admin.timesheets.show.worked')}: {stats.worked}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>{t('admin.timesheets.show.absent')}: {stats.absent}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>{t('admin.timesheets.show.daysoff')}: {stats.daysoff}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span>{t('admin.timesheets.show.weekend')}: {stats.weekend}</span>
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

function AdminTimesheetViewContent({ timesheetId }: { timesheetId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [timesheet, setTimesheet] = useState<TimesheetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTimesheet = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get<TimesheetResponse>(
          apiRoutes.admin.timesheets.detail(timesheetId)
        );

        if (response.data && response.data.success) {
          setTimesheet(response.data.data.timesheet);
        } else {
          setError(t('admin.timesheets.show.errorLoadingData'));
          toast.error(t('admin.timesheets.show.errorLoadingData'));
        }
      } catch (err) {
        console.error('Error fetching timesheet:', err);
        setError(t('admin.timesheets.show.errorLoadingData'));
        toast.error(t('admin.timesheets.show.errorLoadingData'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimesheet();
  }, [timesheetId, t]);

  const handleRejectModalOpen = () => {
    setRejectModalOpen(true);
    setRejectionReason('');
  };

  const handleRejectModalClose = () => {
    setRejectModalOpen(false);
    setRejectionReason('');
  };

  const handleRejectTimesheet = async () => {
    if (!rejectionReason.trim()) {
      toast.error(t('admin.timesheets.show.rejectionReasonRequired'));
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await apiClient.post(
        apiRoutes.admin.timesheets.reject(timesheetId),
        { reason: rejectionReason }
      );

      if (response.data && response.data.success) {
        toast.success(t('admin.timesheets.show.rejectSuccess'));
        if (timesheet) {
          setTimesheet({
            ...timesheet,
            status: 'rejected',
            rejections: [
              ...(timesheet.rejections || []),
              {
                reason: rejectionReason,
                id: Date.now(),
                created_at: new Date().toISOString(),
              }
            ]
          });
        }
        setRejectModalOpen(false);
      } else {
        toast.error(t('admin.timesheets.show.rejectError'));
      }
    } catch (err) {
      console.error('Error rejecting timesheet:', err);
      toast.error(t('admin.timesheets.show.rejectErrorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveTimesheet = async () => {
    try {
      setIsSubmitting(true);

      const response = await apiClient.post(
        apiRoutes.admin.timesheets.validate(timesheetId)
      );

      if (response.data && response.data.success) {
        toast.success(t('admin.timesheets.show.approveSuccess'));
        if (timesheet) {
          setTimesheet({
            ...timesheet,
            status: 'approved'
          });
        }
      } else {
        toast.error(t('admin.timesheets.show.approveError'));
      }
    } catch (err) {
      console.error('Error approving timesheet:', err);
      toast.error(t('admin.timesheets.show.approveErrorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimesheetPeriod = () => {
    if (!timesheet) return '';
    return `${t(`months.${timesheet.month}`)} ${timesheet.year}`;
  };

  const calculateWorkStats = () => {
    if (!timesheet?.pointages) return { workDays: 0, absenceDays: 0 };

    const workDays = timesheet.pointages.filter(p => p.status === 'worked').length;
    const absenceDays = timesheet.pointages.filter(p => p.status === 'absent').length;

    return { workDays, absenceDays };
  };

  const { workDays, absenceDays } = calculateWorkStats();

  return (
    <PageContainer>
      <div className='w-full space-y-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Heading
              title={t('admin.timesheets.show.title')}
              description={t('admin.timesheets.show.description')}
            />
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => router.back()}
              className='h-9'
              size='sm'
            >
              <IconArrowBack className='mr-2 h-4 w-4' />{' '}
              {t('admin.timesheets.show.back')}
            </Button>
            {timesheet && timesheet.status === 'review' && (
              <>
                <Button
                  variant='destructive'
                  onClick={handleRejectModalOpen}
                  className='h-9'
                  size='sm'
                  disabled={isSubmitting}
                >
                  {t('admin.timesheets.show.reject')}
                </Button>
                <Button
                  onClick={handleApproveTimesheet}
                  className='h-9'
                  size='sm'
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? t('common.loading')
                    : t('admin.timesheets.show.approve')}
                </Button>
              </>
            )}
          </div>
        </div>
        <Separator />

        {isLoading ? (
          <TimesheetDetailSkeleton />
        ) : error ? (
          <Card className='border-destructive'>
            <CardContent className='pt-6'>
              <div className='text-destructive space-y-2 text-center'>
                <p className='font-medium'>{error}</p>
                <Button variant='outline' onClick={() => router.back()}>
                  {t('admin.timesheets.show.goBack')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : timesheet ? (
          <div className='grid gap-4'>
            <Card className='overflow-hidden border pt-0 shadow-sm'>
              <div className='bg-primary/5 rounded-t-lg border-b px-6 py-5 shadow-sm'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                  <div className='flex items-center gap-4'>
                    <div className='bg-primary/10 rounded-full p-3'>
                      <IconCalendar className='text-primary h-6 w-6' />
                    </div>
                    <div>
                      <CardTitle className='text-2xl font-bold'>
                        {`${t(`months.${timesheet.month}`)} ${timesheet.year}`}
                      </CardTitle>
                      <CardDescription className='text-muted-foreground mt-1 text-sm'>
                        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
                          {`${t('admin.timesheets.show.submittedOn')} ${formatDate(timesheet.created_at, t)}`}
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    className='px-4 py-2 text-sm font-medium capitalize shadow-sm'
                    variant={getStatusVariant(timesheet.status)}
                  >
                    {timesheet.status === 'review'
                      ? t('admin.timesheets.status.review')
                      : timesheet.status === 'rejected'
                        ? t('admin.timesheets.status.rejected')
                        : timesheet.status === 'approved'
                          ? t('admin.timesheets.status.validated')
                          : timesheet.status === 'validated'
                            ? t('admin.timesheets.status.validated')
                          : t('admin.timesheets.show.status.draft')}
                  </Badge>
                </div>
              </div>

              <CardContent className='p-6 py-6'>
                <div className='grid gap-6'>
                  {timesheet.status === 'rejected' &&
                    timesheet.rejections &&
                    timesheet.rejections.length > 0 && (
                      <Card className='border-destructive/50 rounded-lg border shadow-md'>
                        <CardHeader className='pb-1'>
                          <CardTitle className='text-destructive flex items-center gap-3 text-lg font-semibold'>
                            <IconAlertCircle className='h-6 w-6' />
                            {t('admin.timesheets.show.rejectionReasons')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='pt-2'>
                          <div className='divide-destructive/20 divide-y'>
                            {timesheet.rejections.map((rejection) => (
                              <div key={rejection.id} className='py-3'>
                                <p className='text-muted-foreground mb-1 text-sm'>
                                  {formatDateTime(rejection.created_at, t)}
                                </p>
                                <p>{rejection.reason}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='border-primary/30 rounded-xl border bg-slate-50 p-5 shadow-sm transition-all'>
                      <div className='text-primary mb-3 flex items-center gap-2'>
                        <div className='bg-primary/10 rounded-full p-2'>
                          <IconClock className='h-4 w-4' />
                        </div>
                        <h3 className='font-semibold'>
                          {t('admin.timesheets.show.workSummary')}
                        </h3>
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        <div className='rounded-md border bg-white p-3 text-center'>
                          <p className='text-muted-foreground text-xs'>
                            {t('admin.timesheets.show.workDays')}
                          </p>
                          <p className='text-lg font-semibold text-purple-500'>
                            {workDays}
                          </p>
                        </div>
                        <div className='rounded-md border bg-white p-3 text-center'>
                          <p className='text-muted-foreground text-xs'>
                            {t('admin.timesheets.show.absenceDays')}
                          </p>
                          <p className='text-lg font-semibold text-amber-500'>
                            {absenceDays}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='border-primary/30 rounded-xl border bg-slate-50 p-5 shadow-sm transition-all'>
                      <div className='text-primary mb-3 flex items-center gap-2'>
                        <div className='bg-primary/10 rounded-full p-2'>
                          <IconBriefcase className='h-4 w-4' />
                        </div>
                        <h3 className='font-semibold'>
                          {t('admin.timesheets.show.missionDetails')}
                        </h3>
                      </div>
                      <div className='grid grid-cols-1 gap-4'>
                        <div className='space-y-2'>
                          <div className='flex justify-between'>
                            <p className='text-muted-foreground text-sm'>
                              {t('admin.timesheets.show.missionName')}
                            </p>
                            <p className='font-medium'>
                              {timesheet.mission?.title ||
                                t('admin.timesheets.show.noData')}
                            </p>
                          </div>
                          <div className='flex justify-between'>
                            <p className='text-muted-foreground text-sm'>
                              {t('admin.timesheets.show.consultant')}
                            </p>
                            <p className='font-medium'>
                              {timesheet.consultant?.full_name ||
                                t('admin.timesheets.show.noData')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Calendar View */}
                  <Card className='border shadow-sm'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2'>
                        <IconCalendar className='text-primary h-5 w-5' />
                        {t('admin.timesheets.show.timesheetCalendar')}
                      </CardTitle>
                      <CardDescription>
                        {t('admin.timesheets.show.calendarDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='pt-2'>
                      <MonthlyTimesheetView
                        selectedMonth={timesheet.month}
                        year={timesheet.year}
                        pointages={timesheet.pointages}
                        t={t}
                      />
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            {timesheet.media && timesheet.media.length > 0 ? (
              <Card className='shadow-sm'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2'>
                    <IconFileText className='text-primary h-5 w-5' />
                    {t('admin.timesheets.show.supportingDocuments')}
                  </CardTitle>
                  <CardDescription>
                    {t('admin.timesheets.show.viewDocuments')}
                  </CardDescription>
                </CardHeader>
                <CardContent className='pt-2'>
                  {timesheet.media.map((file) => (
                    <div
                      key={file.id}
                      className='mb-4 overflow-hidden rounded-lg border'
                    >
                      <div className='bg-muted/30 flex items-center justify-between border-b px-4 py-2'>
                        <div className='font-medium'>
                          {file.name || file.file_name}
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8'
                          onClick={() =>
                            window.open(file.original_url, '_blank')
                          }
                        >
                          {t('admin.timesheets.show.openInNewTab')}
                        </Button>
                      </div>
                      {file.mime_type === 'application/pdf' && (
                        <iframe
                          src={file.original_url}
                          className='h-[500px] w-full'
                          title={
                            file.name ||
                            t('admin.timesheets.show.supportingDocument')
                          }
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className='shadow-sm'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2'>
                    <IconFileText className='text-primary h-5 w-5' />
                    {t('admin.timesheets.show.supportingDocuments')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='py-8 pt-2'>
                  <div className='text-muted-foreground text-center'>
                    <p>{t('admin.timesheets.show.noDocuments')}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className='p-6 text-center'>
              <p className='text-muted-foreground'>
                {t('admin.timesheets.show.noTimesheetFound')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rejection Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {t('admin.timesheets.show.rejectTimesheet')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.timesheets.show.rejectDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='reason'>
                {t('admin.timesheets.show.rejectionReason')}
              </Label>
              <Textarea
                id='reason'
                placeholder={t(
                  'admin.timesheets.show.rejectionReasonPlaceholder'
                )}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className='min-h-32'
              />
            </div>
          </div>
          <DialogFooter className='sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              onClick={handleRejectModalClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleRejectTimesheet}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting
                ? t('admin.timesheets.show.rejecting')
                : t('admin.timesheets.show.rejectTimesheet')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <div className="grid gap-5 md:grid-cols-3">
            {Array(3).fill(0).map((_, i) => (
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

export default function AdminTimesheetView({ params }: { params: Promise<{ timesheetId: string }> }) {
  const resolvedParams = React.use(params);
  return <AdminTimesheetViewContent timesheetId={resolvedParams.timesheetId} />;
}