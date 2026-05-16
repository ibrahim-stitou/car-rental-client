'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
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

export default function ContractDetailPage({
                                             params
                                           }: {
  params: Promise<{ contractId: string }>;
}) {
  const router = useRouter();
  const { contractId } = use(params);
  const { t } = useLanguage();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchContractData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(
        apiRoutes.admin.contracts.detail(contractId)
      );
      setContract(response.data.data.contract);
    } catch (err) {
      console.error('Error fetching contract details:', err);
      setError(
        (err as any)?.response?.data?.message ||
        t('admin.contracts.detail.fetchError') || 'Failed to load contract details'
      );
      toast.error(t('admin.contracts.detail.fetchError') || 'Failed to load contract details');
    } finally {
      setIsLoading(false);
    }
  }, [contractId, t]);

  useEffect(() => {
    fetchContractData();
  }, [fetchContractData]);

  const handleEdit = () => {
    router.push(`/admin/contracts/${contractId}/edit`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(apiRoutes.admin.contracts.delete(contractId));
      toast.success(t('admin.contracts.detail.deleteSuccess') || 'Contract deleted successfully');
      setTimeout(() => {
        router.push('/admin/contracts');
      }, 1000);
    } catch (err) {
      console.error('Error deleting contract:', err);
      setError(
        (err as any)?.response?.data?.message ||
        t('admin.contracts.detail.deleteError') || 'Failed to delete contract'
      );
      toast.error(t('admin.contracts.detail.deleteError') || 'Failed to delete contract');
    } finally {
      setIsDeleting(false);
    }
  };
  // Calculate contract duration in days
  const calculateDuration = (startDate?: string, endDate?: string | null) => {
    if (!startDate || !endDate) return t('admin.contracts.detail.ongoing') || 'Ongoing';
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} ${diffDays !== 1 ?
        t('admin.contracts.detail.days') || 'days' :
        t('admin.contracts.detail.day') || 'day'}`;
    } catch (e) {
      return t('admin.contracts.detail.invalidDates') || 'Invalid dates';
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
      'in_progress': {
        label: t('admin.contracts.status.inProgress') || 'In Progress',
        variant: 'default',
        icon: <AlarmClock className='mr-1 h-3 w-3' />
      },
      'terminated': {
        label: t('admin.contracts.status.terminated') || 'Terminated',
        variant: 'destructive',
        icon: <Trash2 className='mr-1 h-3 w-3' />
      },
      'pending': {
        label: t('admin.contracts.status.pending') || 'Pending',
        variant: 'secondary',
        icon: <Clock3 className='mr-1 h-3 w-3' />
      },
      'completed': {
        label: t('admin.contracts.status.completed') || 'Completed',
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
    if (!dateString) return t('admin.contracts.detail.notSpecified') || 'Not specified';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };

  // Helper function to format contract types
  const formatContractType = (type: string) => {
    const contractTypes: Record<string, string> = {
      'cdi': t('admin.contracts.types.cdi') || 'CDI - Permanent Contract',
      'cdd': t('admin.contracts.types.cdd') || 'CDD - Fixed-term Contract',
      'freelance': t('admin.contracts.types.freelance') || 'Freelance',
      'portage': t('admin.contracts.types.portage') || 'Portage Salarial',
      'stage': t('admin.contracts.types.stage') || 'Internship'
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
              {t('common.back') || 'Back'}
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
            <h2 className='text-xl font-bold'>{t('admin.contracts.detail.notFound') || 'Contract Not Found'}</h2>
            <p className='text-center text-gray-500'>
              {t('admin.contracts.detail.notFoundMessage') || "The contract you are looking for doesn't exist or you don't have permission to view it."}
            </p>
            <Button variant='default' onClick={() => router.back()}>
              {t('common.back') || 'Back'}
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
                  {t('admin.contracts.detail.contractLabel') || 'Contract'}:{' '}
                  {contract.reference}
                </h1>
                {renderStatusBadge(contract.status)}
              </div>
              <p className='text-muted-foreground text-sm'>
                {t('admin.contracts.detail.createdOn') || 'Created on'}{' '}
                {formatDate(contract.created_at)}
              </p>

              {/* Consultant Info */}
              <div className='mt-3 flex flex-col gap-2 pt-1 md:flex-row md:gap-6'>
                {contract.consultant && (
                  <div
                    className='flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-blue-600'
                    onClick={() =>
                      router.push(`/admin/users/${contract.consultant_id}/show`)
                    }
                  >
                    <User className='h-4 w-4 text-green-500' />
                    <span className='font-medium'>
                      {t('admin.contracts.detail.consultant') || 'Consultant'}:
                    </span>
                    <span className='underline'>
                      {contract.consultant.full_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className='flex w-full flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 md:w-auto'>
              <Button
                variant='outline'
                onClick={() => router.back()}
                size='sm'
                className='cursor-pointer border-gray-300'
              >
                {t('common.back') || 'Back'}
              </Button>
              <Button
                variant='default'
                onClick={handleEdit}
                disabled={isDeleting}
                size='sm'
                className='bg-primary cursor-pointer'
              >
                <Edit className='mr-1 h-4 w-4' />
                {t('admin.contracts.detail.editContract') || 'Edit Contract'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Single Card Layout */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center text-lg'>
              <FileSignature className='text-primary mr-2 h-5 w-5' />
              {t('admin.contracts.detail.contractInformation') ||
                'Contract Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Contract Type & Status */}
            <div className='space-y-2'>
              <h3 className='font-medium text-gray-700'>
                {t('admin.contracts.detail.contractDetails') ||
                  'Contract Details'}
              </h3>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <FileText className='h-5 w-5' />
                    <span>
                      {t('admin.contracts.detail.contractType') ||
                        'Contract Type'}
                    </span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {formatContractType(contract.contract_type)}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <CheckCircle className='h-5 w-5' />
                    <span>
                      {t('admin.contracts.detail.contractStatus') ||
                        'Contract Status'}
                    </span>
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
                {t('admin.contracts.detail.timeline') || 'Timeline'}
              </h3>
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Calendar className='h-5 w-5' />
                    <span>
                      {t('admin.contracts.detail.startDate') || 'Start Date'}
                    </span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {formatDate(contract.start_at)}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <CalendarCheck className='h-5 w-5' />
                    <span>
                      {t('admin.contracts.detail.endDate') || 'End Date'}
                    </span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {contract.end_at
                      ? formatDate(contract.end_at)
                      : t('admin.contracts.detail.notSpecifiedOngoing') ||
                        'Not specified (Ongoing)'}
                  </p>
                </div>

                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Clock3 className='h-5 w-5' />
                    <span>
                      {t('admin.contracts.detail.duration') || 'Duration'}
                    </span>
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
                {t('admin.contracts.detail.financialDetails') ||
                  'Financial Details'}
              </h3>
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <BadgeEuro className='h-5 w-5' />
                    <span>
                      {t('admin.contracts.detail.perdiem_amount') ||
                        'Flat Fees Amount'}
                    </span>
                  </div>
                  <p className='mt-2 text-sm font-medium'>
                    {contract.fees_amount}€
                  </p>
                </div>
                <div className='rounded-md border bg-white p-4 shadow-sm'>
                  <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                    <Receipt className='h-5 w-5' />
                    <span>
                      {t('admin.contracts.detail.managementFees') ||
                        'Management Fees (%)'}
                    </span>
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
                      {t('admin.contracts.detail.cheque_repas') ||
                        'Cheque Repas'}
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
                    {t('admin.contracts.detail.terminationDetails') ||
                      'Termination Details'}
                  </h3>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='rounded-md border bg-white p-4 shadow-sm'>
                      <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                        <Calendar className='h-5 w-5' />
                        <span>
                          {t('admin.contracts.detail.terminationDate') ||
                            'Termination Date'}
                        </span>
                      </div>
                      <p className='mt-2 text-sm font-medium'>
                        {formatDate(contract.date_resiliation)}
                      </p>
                    </div>

                    <div className='rounded-md border bg-white p-4 shadow-sm'>
                      <div className='text-primary flex items-center space-x-2 text-sm font-medium'>
                        <FileText className='h-5 w-5' />
                        <span>
                          {t('admin.contracts.detail.terminationReason') ||
                            'Termination Reason'}
                        </span>
                      </div>
                      <p className='mt-2 text-sm font-medium'>
                        {contract.motif_resiliation ||
                          t('admin.contracts.detail.noReasonSpecified') ||
                          'No reason specified'}
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
                {t('admin.contracts.detail.notes') || 'Notes'}
              </h3>
              <div className='rounded-md bg-gray-50 p-4'>
                <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                  {contract.notes ||
                    t('admin.contracts.detail.noNotes') ||
                    'No notes provided for this contract.'}
                </p>
              </div>
            </div>

            {/* Document Section */}
            {contract.media && contract.media.length > 0 && (
              <>
                <Separator />
                <div className='space-y-2'>
                  <h3 className='font-medium text-gray-700'>
                    {t('admin.contracts.detail.documents') || 'Documents'}
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