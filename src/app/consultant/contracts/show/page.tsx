'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  FileText,
  User,
  Edit,
  Trash2,
  CheckCircle,
  Clock3,
  AlarmClock,
  FileSignature,
  BadgeEuro,
  CalendarCheck,
  Receipt,
  Eye
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { toast } from '@/components/ui/sonner';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Skeleton } from '@/components/ui/skeleton';
import { useContractStore, Contract } from '@/stores/contract-store';
import { useLanguage } from '@/context/LanguageContext';

export default function ContractDetailPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const fetchContractData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(
        apiRoutes.consultant.contracts.detail
      );
      setContract(response.data.data);
      setNotFound(false);
    } catch (err) {
      console.error('Error fetching contract details:', err);
      if ((err as any)?.response?.status === 404 || (err as any)?.response?.data?.message === "Contract not found") {
        setNotFound(true);
        setError(t('consultant.contracts.error.notFound'));
      } else {
        setError(
          (err as any)?.response?.data?.message ||
          t('consultant.contracts.error.loadFailed')
        );
        toast.error(t('consultant.contracts.error.loadFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchContractData();
  }, [fetchContractData]);
  const calculateDuration = (startDate?: string, endDate?: string | null) => {
    if (!startDate || !endDate) return t('consultant.contracts.duration.ongoing');
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} ${diffDays !== 1 ? t('consultant.contracts.duration.days') : t('consultant.contracts.duration.day')}`;
    } catch (e) {
      return t('consultant.contracts.duration.invalidDates');
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
      'in_progress': {
        label: t('consultant.contracts.status.inProgress'),
        variant: 'default',
        icon: <AlarmClock className='mr-1 h-3 w-3' />
      },
      'terminated': {
        label: t('consultant.contracts.status.terminated'),
        variant: 'destructive',
        icon: <Trash2 className='mr-1 h-3 w-3' />
      },
      'pending': {
        label: t('consultant.contracts.status.pending'),
        variant: 'secondary',
        icon: <Clock3 className='mr-1 h-3 w-3' />
      },
      'completed': {
        label: t('consultant.contracts.status.completed'),
        variant: 'default',
        icon: <CheckCircle className='mr-1 h-3 w-3' />
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
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return t('consultant.contracts.notSpecified');
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };

  // Helper function to format contract types
  const formatContractType = (type: string) => {
    const contractTypes: Record<string, string> = {
      'cdi': t('consultant.contracts.type.cdi'),
      'cdd': t('consultant.contracts.type.cdd'),
      'freelance': t('consultant.contracts.type.freelance'),
      'portage': t('consultant.contracts.type.portage'),
      'stage': t('consultant.contracts.type.stage')
    };

    return contractTypes[type] || type;
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

  // Specific "Contract Not Found" screen with better user experience
  if (notFound) {
    return (
      <PageContainer>
        <div className='h-full w-full space-y-4 bg-gray-50 p-6'>
          <div className='flex flex-col items-center justify-center space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm'>
            <FileText className='h-12 w-12 text-gray-400' />
            <h2 className='text-xl font-bold'>{t('consultant.contracts.notFound.title')}</h2>
            <p className='text-center text-gray-500'>
              {t('consultant.contracts.notFound.description')}
            </p>
            <div className="flex gap-3">
              <Button variant='outline' onClick={() => router.back()}>
                {t('consultant.contracts.back')}
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error && !notFound) {
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
            > {t('consultant.contracts.back')}
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!contract) {
    return (
      <PageContainer>
        <div className='h-full w-full space-y-4 bg-gray-50 p-6'>
          <div className='flex flex-col items-center justify-center space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm'>
            <FileText className='h-12 w-12 text-gray-400' />
            <h2 className='text-xl font-bold'>{t('consultant.contracts.noData.title')}</h2>
            <p className='text-center text-gray-500'>
              {t('consultant.contracts.noData.description')}
            </p>
            <Button variant='default' onClick={() => router.back()}>
              {t('consultant.contracts.back')}
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='h-full w-full space-y-6 overflow-auto bg-gray-50 p-4 md:p-6'>
        {/* Header Section with Consultant Info */}
        <div className='bg-card rounded-lg border shadow-sm'>
          <div className='flex flex-col items-start space-y-4 p-6 md:flex-row md:items-center md:justify-between md:space-y-0'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold tracking-tight'>
                  {t('consultant.contracts.contractLabel')}:{' '}
                  {contract.reference}
                </h1>
                {renderStatusBadge(contract.status)}
              </div>
              <p className='text-muted-foreground text-sm'>
                {t('consultant.contracts.createdOn')}{' '}
                {formatDate(contract.created_at)}
              </p>
            </div>

            <div className='flex w-full flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 md:w-auto'>
              <Button
                variant='outline'
                onClick={() => router.back()}
                size='sm'
                className='cursor-pointer border-gray-300'
              >
                {t('consultant.contracts.back')}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Single Card Layout */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center text-lg'>
              <FileSignature className='text-primary mr-2 h-5 w-5' />
              {t('consultant.contracts.information')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Contract Type & Status */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>
                {t('consultant.contracts.details')}
              </h3>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <FileText className='h-5 w-5' />
                    <span>{t('consultant.contracts.contractType')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {formatContractType(contract.contract_type)}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <CheckCircle className='h-5 w-5' />
                    <span>{t('consultant.contracts.contractStatus')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {renderStatusBadge(contract.status)}
                  </p>
                </div>
              </div>
            </div>
            <Separator />

            {/* Dates & Timeline */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>
                {t('consultant.contracts.timeline')}
              </h3>
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Calendar className='h-5 w-5' />
                    <span>{t('consultant.contracts.startDate')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {formatDate(contract.start_at)}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <CalendarCheck className='h-5 w-5' />
                    <span>{t('consultant.contracts.endDate')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {contract.end_at
                      ? formatDate(contract.end_at)
                      : t('consultant.contracts.notSpecified')}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Clock3 className='h-5 w-5' />
                    <span>{t('consultant.contracts.duration_')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {calculateDuration(contract.start_at, contract.end_at)}
                  </p>
                </div>
              </div>
            </div>
            <Separator />

            {/* Financial Details */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>
                {t('consultant.contracts.financialDetails')}
              </h3>
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <BadgeEuro className='h-5 w-5' />
                    <span>{t('consultant.contracts.flatFeesAmount')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {contract.fees_amount} €
                  </p>
                </div>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Receipt className='h-5 w-5' />
                    <span>{t('consultant.contracts.managementFees')}</span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {contract.management_fees} %
                  </p>
                </div>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Receipt className='h-5 w-5' />
                    <span>
                      {t('admin.contracts.detail.assurance') || 'Assurance'}
                    </span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {contract.assurance}
                  </p>
                </div>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Receipt className='h-5 w-5' />
                    <span>
                      {t('admin.contracts.detail.thirteenthMonth') ||
                        'thirteenth Month'}
                    </span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {contract.tresieme_mois}
                  </p>
                </div>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Receipt className='h-5 w-5' />
                    <span>
                      {t('admin.contracts.detail.cheque_repas') || 'Cheque repas'}
                    </span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {contract.cheque_repas}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            {/* Termination Details (if applicable) */}
            {contract.date_resiliation && (
              <>
                <div className='space-y-2'>
                  <h3 className='font-medium text-gray-700'>
                    {t('consultant.contracts.terminationDetails')}
                  </h3>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='rounded-md border bg-white p-4 shadow-sm'>
                      <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                        <Calendar className='h-5 w-5' />
                        <span>{t('consultant.contracts.terminationDate')}</span>
                      </div>
                      <p className='mt-2 text-sm font-medium'>
                        {formatDate(contract.date_resiliation)}
                      </p>
                    </div>

                    <div className='rounded-md border bg-white p-4 shadow-sm'>
                      <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                        <FileText className='h-5 w-5' />
                        <span>
                          {t('consultant.contracts.terminationReason')}
                        </span>
                      </div>
                      <p className='mt-2 text-sm font-medium'>
                        {contract.motif_resiliation ||
                          t('consultant.contracts.noReasonSpecified')}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Notes */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>
                {t('consultant.contracts.notes')}
              </h3>
              <div className='rounded-md bg-gray-50 p-4'>
                <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                  {contract.notes || t('consultant.contracts.noNotes')}
                </p>
              </div>
            </div>
            {/* Document Section */}
            {contract.media && contract.media.length > 0 && (
              <>
                <Separator />
                <div className='space-y-2'>
                  <h3 className='font-medium text-gray-700'>
                    {t('consultant.contracts.documents') || 'Documents'}
                  </h3>
                  <div className='rounded-md border bg-white p-4 shadow-sm'>
                    {contract.media.map((document: any) => (
                      <div
                        key={document.id}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <FileText className='text-primary h-5 w-5' />
                          <div>
                            <p className='font-medium'>{document.name}</p>
                            <p className='text-xs text-gray-500'>
                              {(document.size / 1024).toFixed(2)} KB •{' '}
                              {document.mime_type} •{' '}
                              {format(new Date(document.created_at), 'PPP')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            window.open(document.original_url, '_blank')
                          }
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