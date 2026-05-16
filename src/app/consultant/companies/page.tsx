'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CompanyCard from '@/features/consultant/my-companies/components/company-card';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { toast } from '@/components/ui/sonner';
import { Loader2, AlertCircle, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/context/LanguageContext';

type Company = {
  id: number;
  name: string;
  companyid: string;
  pays: {
    id: number;
    nom: string;
  };
  IBAN?: string;
  bank_name?: string;
  status: 'active' | 'inactive';
};

const MyCompaniesPage = () => {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(apiRoutes.consultant.consultantCompanies.list);
      setCompanies(response.data.data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(t('consultant.my_companies.errors.load_failed'));
      toast.error(t('consultant.my_companies.errors.load_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(apiRoutes.consultant.consultantCompanies.delete(companyToDelete));
      setCompanies((prev) => prev.filter((company) => company.id !== companyToDelete));
      toast.success(t('consultant.my_companies.delete_success'));
    } catch (err) {
      console.error('Error deleting company:', err);
      toast.error(t('consultant.my_companies.errors.delete_failed'));
    } finally {
      setIsDeleting(false);
      setCompanyToDelete(null);
    }
  };

  return (
    <PageContainer>
      <div className='w-full space-y-6 py-6'>
        <div className='flex justify-between items-center'>
          <h3 className='text-3xl font-bold text-gray-900'>
            {t('consultant.my_companies.title')}
          </h3>
          <Link href='/consultant/companies/new'>
            <Button>{t('consultant.my_companies.add_new')}</Button>
          </Link>
        </div>

        {error && (
          <Alert variant='destructive' className='border-red-400 bg-red-50'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className='flex justify-center py-16'>
            <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
          </div>
        ) : companies.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50 p-12 text-center'>
            <Building2 className='mb-4 h-12 w-12 text-gray-400' />
            <h3 className='mb-2 text-lg font-medium'>
              {t('consultant.my_companies.empty_state.title')}
            </h3>
            <p className='mb-6 text-sm text-gray-500'>
              {t('consultant.my_companies.empty_state.description')}
            </p>
            <Link href='/consultant/companies/new'>
              <Button>{t('consultant.my_companies.empty_state.action')}</Button>
            </Link>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onDelete={(id) => setCompanyToDelete(id)}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={companyToDelete !== null} onOpenChange={() => setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('consultant.my_companies.delete_modal.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('consultant.my_companies.delete_modal.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isDeleting
                ? t('consultant.my_companies.delete_modal.deleting')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default MyCompaniesPage;