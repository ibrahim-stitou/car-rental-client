'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Building,
  User,
  FileText,
  Edit,
  CheckCircle,
  Clock3,
  AlarmClock,
  BriefcaseBusiness,
  BadgeEuro,
  CalendarCheck,
  MapPinned,
  Eye
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { toast } from '@/components/ui/sonner';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

export default function MissionDetailPage({
                                            params
                                          }: {
  params: Promise<{ missionId: string }>;
}) {
  const router = useRouter();
  const { missionId } = use(params);
  const { t } = useLanguage();

  interface Mission {
    id: string;
    title: string;
    created_at: string;
    description?: string;
    date_debut?: string;
    date_fin?: string;
    tjm?: string;
    tjm_type?: string;
    adresse_prin?: string;
    country?: { nom: string; code: string };
    status: string;
    taux_fkm?: string | null;
    consultant_reference?: string | null;
    client?: {
      id: string;
      name: string;
      mail: string;
      phone: string;
      address: string;
      city: string;
      code_postal: string;
    };
    client_id?: string;
    consultant?: {
      id: string;
      full_name: string;
      email: string;
      telephone: string;
      status: string;
      profile_image_url?: string;
    };
    user_id?: string;
    media?: Array<{
      id: number;
      name: string;
      file_name: string;
      mime_type: string;
      size: number;
      original_url: string;
      preview_url: string;
      created_at: string;
      collection_name: string;
    }>;
  }

  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchMissionData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(
        apiRoutes.admin.missions.detail(missionId)
      );
      setMission(response.data.data.mission);
    } catch (err) {
      console.error('Error fetching mission details:', err);
      setError(
        (err as any)?.response?.data?.message ||
        t('admin.missions.errorLoading')
      );
      toast.error(t('admin.missions.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, [missionId, t]);

  useEffect(() => {
    fetchMissionData();
  }, [fetchMissionData]);

  const handleEdit = () => {
    router.push(`/admin/missions/${missionId}/edit`);
  };

  const calculateDuration = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return t('admin.missions.show.noLocationSpecified');
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} ${diffDays !== 1 ? t('common.days') : t('common.day')}`;
    } catch (e) {
      return t('common.invalidDates');
    }
  };
  const renderStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant:
          | 'default'
          | 'destructive'
          | 'secondary'
          | 'outline'
          | null
          | undefined;
        icon: React.ReactNode;
      }
    > = {
      active: {
        label: t('admin.missions.status.active'),
        variant: 'default',
        icon: <CheckCircle className='mr-1 h-3 w-3' />
      },
      inactive: {
        label: t('admin.missions.status.inactive'),
        variant: 'secondary',
        icon: <Clock3 className='mr-1 h-3 w-3' />
      },
      pending: {
        label: t('admin.missions.status.pending'),
        variant: 'destructive',
        icon: <AlarmClock className='mr-1 h-3 w-3' />
      }
    };

    const config = statusConfig[status] || {
      label: status,
      variant: 'secondary',
      icon: <FileText className='mr-1 h-3 w-3' />
    };

    return (
      <Badge
        variant={config.variant}
        className='flex items-center gap-1 px-2 py-1 text-xs'
      >
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('admin.missions.show.noLocationSpecified');
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col p-3 space-y-4 bg-gray-50">
        <div className="flex items-start justify-between">
          <Skeleton className="h-8 w-64" />
        </div>
        <Card className="w-full border shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="border p-4 rounded-md space-y-4 bg-white shadow-sm">
                <Skeleton className="h-6 w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className='h-full w-full space-y-4 bg-gray-50 p-6'>
          <Alert variant='destructive' className='border-red-400 bg-red-50'>
            <AlertDescription className='font-medium'>{error}</AlertDescription>
          </Alert>
          <div className='flex justify-center'>
            <Button
              variant='outline'
              onClick={() => router.back()}
              className='mt-4'
            > {t('common.back')}
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!mission) {
    return (
      <PageContainer>
        <div className='h-full w-full space-y-4 bg-gray-50 p-6'>
          <div className='flex flex-col items-center justify-center space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm'>
            <FileText className='h-12 w-12 text-gray-400' />
            <h2 className='text-xl font-bold'>{t('common.notFound')}</h2>
            <p className='text-center text-gray-500'>
              {t('common.noPermission')}
            </p>
            <Button variant='default' onClick={() => router.back()}>{t('common.back')}
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='h-full w-full space-y-6 overflow-auto bg-gray-50 p-4 md:p-6'>
        {/* Header Section with Client & Consultant Info */}
        <div className='bg-card rounded-lg border shadow-sm'>
          <div className='flex flex-col items-start space-y-4 p-6 md:flex-row md:items-center md:justify-between md:space-y-0'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold tracking-tight'>
                  {mission.title}
                </h1>
                {renderStatusBadge(mission.status)}
              </div>
              <p className='text-muted-foreground text-sm'>
                {t('common.createdOn')} {formatDate(mission.created_at)}
              </p>
              {/* Client and Consultant Info */}
              {/* Client and Consultant Info */}
              <div className='mt-3 flex flex-col gap-2 pt-1 md:flex-row md:gap-6'>
                {mission.client && (
                  <div
                    className='flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 transition-colors'
                    onClick={() => router.push(`/admin/clients/${mission.client_id}/show`)}
                  >
                    <Building className='h-4 w-4 text-blue-500' />
                    <span className='font-medium'>{t('admin.missions.show.clientDetails')}:</span>
                    <span className='underline'>{mission.client.name}</span>
                  </div>
                )}

                {mission.consultant && (
                  <div
                    className='flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 transition-colors'
                    onClick={() => router.push(`/admin/users/${mission.user_id}/show`)}
                  >
                    <User className='h-4 w-4 text-green-500' />
                    <span className='font-medium'>{t('admin.missions.show.consultantDetails')}:</span>
                    <span className='underline'>{mission.consultant.full_name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className='flex w-full flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 md:w-auto'>
              <Button
                variant='outline'
                onClick={() => router.back()}
                size='sm'
                className='border-gray-300 cursor-pointer'
              >
                {t('admin.missions.show.back')}
              </Button>
              <Button
                variant='default'
                onClick={handleEdit}
                disabled={isDeleting}
                size='sm'
                className='bg-primary cursor-pointer'
              >
                <Edit className='mr-1 h-4 w-4 ' />
                {t('admin.missions.show.edit')}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
        </div>

        {/* Main Content - Single Card Layout */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center text-lg'>
              <BriefcaseBusiness className='text-primary mr-2 h-5 w-5' />
              {t('admin.missions.show.missionDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>

            {/* Dates & Timeline */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>{t('admin.missions.show.timeline')}</h3>
              <div className='grid gap-4 md:grid-cols-4'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Calendar className='h-5 w-5' />
                    <span>{t('admin.missions.show.startDate')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {formatDate(mission.date_debut)}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <CalendarCheck className='h-5 w-5' />
                    <span>{t('admin.missions.show.endDate')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {formatDate(mission.date_fin)}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Clock className='h-5 w-5' />
                    <span>{t('admin.missions.show.duration')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {calculateDuration(
                      mission.date_debut,
                      mission.date_fin
                    )}
                  </p>
                </div>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Clock className='h-5 w-5' />
                    <span>{t('admin.missions.show.timeLeft')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {mission.date_fin
                      ? calculateDuration(new Date().toISOString(), mission.date_fin)
                      : '----'}
                  </p>
                </div>
              </div>
            </div>
            <Separator />

            {/* Financial Details */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>
                {t('admin.missions.show.financialDetails')}
              </h3>
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <BadgeEuro className='h-5 w-5' />
                    <span>{t('admin.missions.show.tjm')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {mission.tjm ||'----'}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Clock className='h-5 w-5' />
                    <span>{t('admin.missions.show.tjmType')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {mission.tjm_type === 'forfait'
                      ? t('admin.missions.form.dailyRate')
                      : mission.tjm_type === 'journalier'
                        ? t('admin.missions.form.hourlyRate')
                        : '----'}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <BadgeEuro className='h-5 w-5' />
                    <span>{t('admin.missions.form.taux_fkm')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {mission.taux_fkm ? `${mission.taux_fkm} €/km` : '----'}
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <FileText className='h-5 w-5' />
                    <span>{t('admin.missions.form.consultant_reference')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {mission.consultant_reference || '----'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>{t('admin.missions.show.workLocation')}</h3>
              <div className='rounded-md border bg-white p-4 shadow-sm'>
                <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                  <MapPinned className='h-5 w-5' />
                  <span>{t('admin.missions.show.workLocation')}</span>
                </div>
                <p className='mt-2 text-sm'>
                  {mission.adresse_prin
                    ? mission.adresse_prin
                    : t('admin.missions.show.noLocationSpecified')}
                  {mission.country?.nom && `, ${mission.country.nom}`}
                </p>
              </div>
            </div>
            <Separator />
            {/* Description */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>{t('admin.missions.show.description_')}</h3>
              <div className='rounded-md bg-gray-50 p-4'>
                <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                  {mission.description ||
                    t('admin.missions.show.noDescription')}
                </p>
              </div>
            </div>
            {/* Document Section */}
            {mission.media && mission.media.length > 0 && (
              <>
                <Separator />
                <div className='space-y-2'>
                  <h3 className='font-medium text-gray-700'>{t('admin.missions.show.documents')}</h3>
                  <div className='rounded-md border bg-white p-4 shadow-sm'>
                    {mission.media.map((document: any) => (
                      <div key={document.id} className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <FileText className='h-5 w-5 text-primary' />
                          <div>
                            <p className='font-medium'>{document.name}</p>
                            <p className='text-xs text-gray-500'>
                              {(document.size / 1024).toFixed(2)} KB • {document.mime_type} • {format(new Date(document.created_at), 'PPP')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(document.original_url, '_blank')}
                          className='flex items-center gap-2'
                        >
                          <Eye className='h-4 w-4' />
                          {t('common.view')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}