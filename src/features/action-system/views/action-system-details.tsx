'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/LanguageContext';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import {
  LayoutGrid,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Tag
} from 'lucide-react';

interface ConsultantDetail {
  amount: string;
  contract_id: number;
  consultant_id: number;
  consultant_name: string;
  contract_reference: string | null;
}

interface GenerationDetails {
  generation: {
    id: number;
    action_type: string;
    month: number;
    year: number;
    generated_count: number;
    skipped_count: number;
    error_count: number;
    total_count: number;
    total_amount: string;
    generated_by: number;
    last_generation_date: string;
    created_at: string;
    updated_at: string;
  };
  consultant_details: ConsultantDetail[];
}

interface ActionSystemDetailsViewProps {
  id: string;
}

const GenerationDetailsSkeleton = () => {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='space-y-2'>
          <Skeleton className='h-10 w-1/2' />
          <Skeleton className='h-6 w-1/3' />
        </div>
        <Separator />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Generation Information Skeleton */}
          <Card className='shadow-sm'>
            <CardHeader className='pb-2'>
              <Skeleton className='h-6 w-1/2' />
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {[...Array(6)].map((_, index) => (
                  <div key={index} className='flex justify-between items-center'>
                    <Skeleton className='h-4 w-1/3' />
                    <Skeleton className='h-4 w-1/4' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generation Counts Skeleton */}
          <Card className='shadow-sm'>
            <CardHeader className='pb-2'>
              <Skeleton className='h-6 w-1/2' />
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {[...Array(3)].map((_, index) => (
                  <div key={index} className='flex justify-between items-center'>
                    <Skeleton className='h-4 w-1/3' />
                    <Skeleton className='h-6 w-1/4' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consultant Details Skeleton */}
        <Card className='shadow-sm'>
          <CardHeader className='pb-2'>
            <Skeleton className='h-6 w-1/2' />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(4)].map((_, index) => (
                    <TableHead key={index}>
                      <Skeleton className='h-4 w-full' />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {[...Array(4)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className='h-4 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

const ActionSystemDetailsView: React.FC<ActionSystemDetailsViewProps> = ({ id }) => {
  const { t, language } = useLanguage();
  const [details, setDetails] = useState<GenerationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await apiClient.get(
          apiRoutes.admin.systemAction.generationDetails(id)
        );
        setDetails(response.data);
        setIsLoading(false);
      } catch (error) {
        toast.error(t('common.error.fetch'));
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id, t]);

  if (isLoading) {
    return <GenerationDetailsSkeleton />;
  }

  if (!details) {
    return <PageContainer>{t('common.error.not_found')}</PageContainer>;
  }

  const { generation, consultant_details } = details;

  // Helper function to get action type display name
  const getActionTypeDisplay = (type: string) => {
    if (type === 'flat_fees') {
      return t('admin.system-actions.types.flat_fees');
    }
    if (type === 'tresieme_mois') {
      return t('admin.system-actions.types.tresieme_mois');
    }
    return t('admin.system-actions.types.insurance');
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title={t('admin.system-actions.generation_details.title')}
          description={`${t('months.' + generation.month)} ${generation.year}`}
        />
        <Separator />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Generation Information Card */}
          <Card className='shadow-sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <LayoutGrid className='w-5 h-5 text-muted-foreground' />
                {t('admin.system-actions.generation_details.generation_info')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground flex items-center gap-2'>
                    <Tag className='w-4 h-4' />
                    {t('admin.system-actions.table.action_type')}:
                  </span>
                  <Badge variant='default' className='px-3 py-1'>
                    {getActionTypeDisplay(generation.action_type)}
                  </Badge>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground flex items-center gap-2'>
                    <Calendar className='w-4 h-4' />
                    {t('admin.system-actions.table.month')}:
                  </span>
                  <span>{t(`months.${generation.month}`)}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground flex items-center gap-2'>
                    <Calendar className='w-4 h-4' />
                    {t('admin.system-actions.table.year')}:
                  </span>
                  <span>{generation.year}</span>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground flex items-center gap-2'>
                    <DollarSign className='w-4 h-4' />
                    {t('admin.system-actions.table.total_amount')}:
                  </span>
                  <span className='font-semibold text-primary'>
                    {new Intl.NumberFormat(language, {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(parseFloat(generation.total_amount))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generation Counts Card */}
          <Card className='shadow-sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CheckCircle2 className='w-5 h-5 text-muted-foreground' />
                {t('admin.system-actions.generation_details.generation_counts')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground'>
                    {t('admin.system-actions.generation_details.total_generated')}:
                  </span>
                  <Badge variant='secondary' className='px-3 py-1'>
                    {generation.generated_count}
                  </Badge>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground'>
                    {t('admin.system-actions.generation_details.total_skipped')}:
                  </span>
                  <Badge variant='outline' className='px-3 py-1'>
                    {generation.skipped_count}
                  </Badge>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground'>
                    {t('admin.system-actions.generation_details.total_errors')}:
                  </span>
                  <Badge
                    variant={generation.error_count > 0 ? 'destructive' : 'outline'}
                    className={`px-3 py-1 ${generation.error_count > 0 ? 'text-white' : ''}`}
                  >
                    {generation.error_count}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consultant Details Table */}
        <Card className='shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='w-5 h-5 text-muted-foreground' />
              {t('admin.system-actions.generation_details.consultant_details')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consultant_details.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.system-actions.consultant_name')}</TableHead>
                    <TableHead>{t('admin.system-actions.contract_id')}</TableHead>
                    <TableHead>{t('admin.system-actions.amount')}</TableHead>
                    <TableHead>{t('common.reference')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultant_details.map((consultant, index) => (
                    <TableRow key={index}>
                      <TableCell className='flex items-center gap-2'>
                        <User className='w-4 h-4 text-muted-foreground' />
                        {consultant.consultant_name}
                      </TableCell>
                      <TableCell>{consultant.contract_id}</TableCell>
                      <TableCell className='font-semibold text-primary'>
                        {new Intl.NumberFormat(language, {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(parseFloat(consultant.amount))}
                      </TableCell>
                      <TableCell>
                        {consultant.contract_reference || t('common.not_available')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <div className='flex items-center gap-2 text-muted-foreground'>
              <AlertTriangle className='w-4 h-4' />
              {t('admin.system-actions.generation_details.no_generated_items')}
            </div>}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ActionSystemDetailsView;