'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  User,
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
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
  CardTitle,
  CardDescription,
  CardFooter
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
    created_at: string;
    description?: string;
    date_debut?: string;
    date_fin?: string;
    tjm?: string;
    tjm_type?: string;
    adresse_prin?: string;
    country?: { nom: string; code: string };
    status: string;
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
  }

  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchMissionData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(
        apiRoutes.consultant.missions.detail(missionId)
      );
      setMission(response.data.data);
    } catch (err) {
      console.error('Error fetching mission details:', err);
      setError(
        (err as any)?.response?.data?.message ||
        t('consultant.missions.error.loadFailed')
      );
      toast.error(t('consultant.missions.error.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [missionId, t]);

  useEffect(() => {
    fetchMissionData();
  }, [fetchMissionData]);

  // Calculate mission duration in days
  const calculateDuration = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return t('consultant.missions.duration.notSpecified');
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} ${diffDays !== 1 ? t('consultant.missions.duration.days') : t('consultant.missions.duration.day')}`;
    } catch (e) {
      return t('consultant.missions.duration.invalidDates');
    }
  };

  // Helper function to render status badge with appropriate color
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
      en_attente: {
        label: t('consultant.missions.status.pending'),
        variant: 'secondary',
        icon: <Clock3 className='mr-1 h-3 w-3' />
      },
      en_cours: {
        label: t('consultant.missions.status.inProgress'),
        variant: 'default',
        icon: <AlarmClock className='mr-1 h-3 w-3' />
      },
      termine: {
        label: t('consultant.missions.status.completed'),
        variant: 'default',
        icon: <CheckCircle className='mr-1 h-3 w-3' />
      },
      annule: {
        label: t('consultant.missions.status.cancelled'),
        variant: 'destructive',
        icon: <Trash2 className='mr-1 h-3 w-3' />
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

  // Helper function to format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('consultant.missions.date.notSpecified');
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
            >
              {t('consultant.missions.back')}
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
            <h2 className='text-xl font-bold'>{t('consultant.missions.notFound.title')}</h2>
            <p className='text-center text-gray-500'>
              {t('consultant.missions.notFound.description')}
            </p>
            <Button variant='default' onClick={() => router.back()}>
              {t('consultant.missions.back')}
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
                {t('consultant.missions.createdOn')} {formatDate(mission.created_at)}
              </p>

              {/* Client and Consultant Info */}
              <div className='mt-3 flex flex-col gap-1 pt-1 md:flex-row md:gap-3'>
                {mission.client && (
                  <Badge
                    variant='outline'
                    className='flex items-center gap-1 border-blue-200 text-xs'
                  >
                    <Building className='h-3 w-3 text-blue-500' />
                    {t('consultant.missions.client')}: {mission.client.name}
                  </Badge>
                )}

                {mission.consultant && (
                  <Badge
                    variant='outline'
                    className='flex items-center gap-1 border-green-200 text-xs'
                  >
                    <User className='h-3 w-3 text-green-500' />
                    {t('consultant.missions.consultant')}: {mission.consultant.full_name}
                  </Badge>
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
                {t('consultant.missions.back')}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Single Card Layout */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center text-lg'>
              <BriefcaseBusiness className='text-primary mr-2 h-5 w-5' />
              {t('consultant.missions.information')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>

            {/* Dates & Timeline */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>{t('consultant.missions.timeline')}</h3>
              <div className='grid gap-4 md:grid-cols-4'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Calendar className='h-5 w-5' />
                    <span>{t('consultant.missions.startDate')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {formatDate(mission.date_debut)}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <CalendarCheck className='h-5 w-5' />
                    <span>{t('consultant.missions.endDate')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {formatDate(mission.date_fin)}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Clock3 className='h-5 w-5' />
                    <span>{t('consultant.missions.duration_')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {calculateDuration(mission.date_debut, mission.date_fin)}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <CheckCircle className='h-5 w-5' />
                    <span>{t('consultant.missions.status.label')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {renderStatusBadge(mission.status)}
                  </p>
                </div>
              </div>
            </div>
            <Separator />

            {/* Financial Details */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>
                {t('consultant.missions.financialDetails')}
              </h3>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <BadgeEuro className='h-5 w-5' />
                    <span>{t('consultant.missions.dailyRate')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {mission.tjm ? `${mission.tjm} €` : t('consultant.missions.notSpecified')}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <FileText className='h-5 w-5' />
                    <span>{t('consultant.missions.rateType')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {mission.tjm_type || t('consultant.missions.notSpecified')}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>{t('consultant.missions.location')}</h3>
              <div className='rounded-md border bg-white p-4 shadow-sm'>
                <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                  <MapPinned className='h-5 w-5' />
                  <span>{t('consultant.missions.workLocation')}</span>
                </div>
                <p className='mt-2 text-sm'>
                  {mission.adresse_prin
                    ? `${mission.adresse_prin}${mission.country ? `, ${mission.country.nom}` : ''}`
                    : t('consultant.missions.noLocationSpecified')
                  }
                </p>
              </div>
            </div>
            <Separator />

            {/* Description */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>{t('consultant.missions.description')}</h3>
              <div className='rounded-md bg-gray-50 p-4'>
                <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                  {mission.description ||
                    t('consultant.missions.noDescription')}
                </p>
              </div>
            </div>
            {
              //@ts-ignore
              mission.media && mission.media.length > 0 && (
              <>
                <Separator />
                <div className='space-y-2'>
                  <h3 className='font-medium text-gray-700'>{t('consultant.missions.documents') || 'Documents'}</h3>
                  <div className='rounded-md border bg-white p-4 shadow-sm'>
                    {//@ts-ignore
                      mission.media.map((document: any) => (
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
                          {t('common.view') || 'View'}
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