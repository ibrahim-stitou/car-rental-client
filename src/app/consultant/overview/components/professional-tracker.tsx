'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import {
  TrendingUp,
  Wallet,
  Scale,
  PieChart,
  BarChart,
  Download,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  BriefcaseIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ExpensesByMonth from '@/app/consultant/overview/components/tracker-component';
import { useLanguage } from '@/context/LanguageContext';

interface MonthData {
  month: string;
  invoice: number;
  payment: number;
  managementFees: number;
  employeeSocialContribution: number;
  employerSocialContribution: number;
  netSalary: number;
  flatRateExpenses: number;
  mileageExpenses: number;
  otherExpenses: number;
  effectiveBalance: number;
  insuranceFees:number;
  thirteenthMonth: number;
  chequeRepas:number;
  taxes: number;
  subcontractorInvoices: number;
  paymentStatus?: 'paid' | 'unpaid' | null;
}

interface SalaryDataType {
  [key: string]: MonthData[];
}

interface ConsultantProfile {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  pays?: { nom: string };
  ville?: string;
  adresse?: string;
  code_postal?: string;
  numero_secu?: string;
  siret?: string;
  role?: { name: string };
}

interface ExpenseRow {
  name: string;
  key: keyof MonthData;
  icon: React.ReactNode;
  color: string;
  style?: string;
}

export default function ProfessionalFinanceDashboard() {
  const { t } = useLanguage();
  const [activeYear, setActiveYear] = useState<string>(new Date().getFullYear().toString());
  const [salaryData, setSalaryData] = useState<SalaryDataType>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [consultantProfile, setConsultantProfile] = useState<ConsultantProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSalaryData(activeYear);
    fetchConsultantProfile();
  }, [activeYear]);

  const fetchConsultantProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await apiClient.get(apiRoutes.consultant.profile.detail);
      if (response.data?.data) {
        setConsultantProfile(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching consultant profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchSalaryData = async (year: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(apiRoutes.consultant.tracker.trackerPerYear(year));
      if (response.data?.success) {
        const reversedData = [...response.data.data];
        setSalaryData((prev) => ({ ...prev, [year]: reversedData }));
      } else {
        setError(t('consultant.tracker.error.fetch'));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('consultant.tracker.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string | number | 'paid' | 'unpaid') =>
    typeof value === 'number' ? value.toLocaleString('en-US', { style: 'currency', currency: 'EUR' }) : value;

  const calculateColumnTotal = (field: keyof MonthData): number => {
    if (!salaryData[activeYear] || salaryData[activeYear].length === 0) {
      return 0;
    }
    //@ts-ignore
    return salaryData[activeYear].reduce((sum, monthData) => sum + (monthData[field] || 0), 0);
  };

  // Calculate total expenses
  const calculateTotalExpenses = (): number => {
    return (
      calculateColumnTotal('managementFees') +
      calculateColumnTotal('employeeSocialContribution') +
      calculateColumnTotal('employerSocialContribution') +
      calculateColumnTotal('flatRateExpenses') +
      calculateColumnTotal('mileageExpenses') +
      calculateColumnTotal('otherExpenses') +
      calculateColumnTotal('taxes')+
      calculateColumnTotal('insuranceFees')+
      calculateColumnTotal('subcontractorInvoices')+
      calculateColumnTotal('netSalary')+
      calculateColumnTotal('thirteenthMonth')+
      calculateColumnTotal('chequeRepas')
    );
  };

  const exportToExcel = async () => {
    try {
      const response = await apiClient.get(
        apiRoutes.consultant.tracker.exportToExcel(activeYear),
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-data-${activeYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert(t('consultant.tracker.error.export'));
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const expenseRows: ExpenseRow[] = [
    {
      name: t('consultant.tracker.expenses.invoice'),
      key: 'invoice',
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      color: 'black'
    },
    {
      name: t('consultant.tracker.expenses.payment'),
      key: 'payment',
      icon: <Wallet className="h-4 w-4 text-green-500" />,
      color: 'text-green-600'
    },
    {
      name: t('consultant.tracker.expenses.managementFees'),
      key: 'managementFees',
      icon: <PieChart className="h-4 w-4 text-blue-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.employeeSocialContribution'),
      key: 'employeeSocialContribution',
      icon: <Scale className="h-4 w-4 text-purple-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.employerSocialContribution'),
      key: 'employerSocialContribution',
      icon: <Scale className="h-4 w-4 text-purple-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.netSalary'),
      key: 'netSalary',
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.insuranceFees'),
      key: 'insuranceFees',
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.thirteenthMonth'),
      key: 'thirteenthMonth',
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.cheque_repas'),
      key: 'chequeRepas',
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.flatRateExpenses'),
      key: 'flatRateExpenses',
      icon: <Wallet className="h-4 w-4 text-green-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.mileageExpenses'),
      key: 'mileageExpenses',
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.subcontractorInvoices'),
      key: 'subcontractorInvoices',
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.otherExpenses'),
      key: 'otherExpenses',
      icon: <PieChart className="h-4 w-4 text-red-500" />,
      color: 'text-red-600'
    },
    {
      name: t('consultant.tracker.expenses.effectiveBalance'),
      key: 'effectiveBalance',
      icon: <PieChart className="h-4 w-4 text-red-500" />,
      color: 'text-purple-600',
      style: 'bg-purple-100 hover:bg-purple-200 transition-colors duration-200 ease-in-out'
    }
  ];

  // Skeleton loader for the metrics
  const MetricSkeleton = () => (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-8 w-32 rounded-md" />
      </CardContent>
    </Card>
  );

  // Skeleton loader for the table
  const TableSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          {[...Array(8)].map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className=''>
      <Card className="mb-6 bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden border border-gray-100 p-0">
        <CardContent className="p-2">
          {profileLoading ? (
            <div className="flex items-center space-x-4 p-2">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-5 w-[280px]" />
                <Skeleton className="h-4 w-[220px]" />
              </div>
            </div>
          ) : consultantProfile ? (
            <div className="flex flex-col space-y-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center space-x-5">
                <Avatar className="h-16 w-16 ring-4 ring-indigo-100 shadow-sm">
                  <AvatarImage src="" alt={`${consultantProfile.prenom} ${consultantProfile.nom}`} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white text-lg font-medium">
                    {getInitials(consultantProfile.prenom, consultantProfile.nom)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {consultantProfile.prenom} {consultantProfile.nom}
                  </h2>
                  <div className="flex items-center mt-1">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                {consultantProfile.role?.name || t('consultant.profile.error.role_not_specified')}
              </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4 md:mt-0">
                <div className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
                  <MailIcon className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">{t('consultant.profile.email')}</p>
                    <p className="text-sm font-medium mt-1 break-all">{consultantProfile.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
                  <PhoneIcon className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">{t('consultant.profile.phone_number')}</p>
                    <p className="text-sm font-medium mt-1">{consultantProfile.telephone || t('consultant.profile.error.not_specified')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
                  <MapPinIcon className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">{t('consultant.profile.country')}</p>
                    <p className="text-sm font-medium mt-1">
                      {consultantProfile.ville && consultantProfile.pays?.nom
                        ? `${consultantProfile.ville}, ${consultantProfile.pays.nom}`
                        : consultantProfile.pays?.nom || t('consultant.profile.error.not_specified')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-gray-500">
              <div className="flex flex-col items-center justify-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <BriefcaseIcon className="h-5 w-5 text-gray-500" />
          </span>
                <p className="mt-2">{t('consultant.profile.error.loading')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className='mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <h1 className='text-2xl font-bold text-gray-800 md:text-3xl'>
          {t('consultant.tracker.title')}
        </h1>
        <div className='flex items-center gap-4'>
          <div className='inline-flex rounded-lg bg-white p-1 shadow-sm'>
            <Button
              onClick={() => setActiveYear((new Date().getFullYear() - 1).toString())}
              variant='ghost'
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                activeYear === (new Date().getFullYear() - 1).toString()
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {new Date().getFullYear() - 1}
            </Button>
            <Button
              onClick={() => setActiveYear(new Date().getFullYear().toString())}
              variant='ghost'
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                activeYear === new Date().getFullYear().toString()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {new Date().getFullYear()}
            </Button>
          </div>
          <Button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={loading || !salaryData[activeYear] || salaryData[activeYear].length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('consultant.tracker.export')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className='space-y-8'>
          {/* Skeleton for metrics */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>

          {/* Skeleton for table */}
          <Card className='p-6 shadow-lg'>
            <CardContent className='mb-6 p-0'>
              <Skeleton className='h-6 w-48 rounded-md' />
            </CardContent>
            <TableSkeleton />
          </Card>
        </div>
      ) : error ? (
        <div className='rounded-lg bg-red-50 p-8 text-center text-red-600'>
          {error}
        </div>
      ) : (
        <div className='space-y-8'>
          {/* Key Metrics */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
            <Card className='shadow-md transition-shadow hover:shadow-lg'>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-700'>
                    {t('consultant.tracker.metrics.totalInvoiced')}
                  </h3>
                  <TrendingUp className='h-6 w-6 text-indigo-600' />
                </div>
                <p className='mt-2 text-2xl font-bold text-gray-900'>
                  {formatCurrency(calculateColumnTotal('invoice'))}
                </p>
              </CardContent>
            </Card>
            <Card className='shadow-md transition-shadow hover:shadow-lg'>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-700'>
                    {t('consultant.tracker.metrics.totalPayments')}
                  </h3>
                  <PieChart className='h-6 w-6 text-blue-600' />
                </div>
                <p className='mt-2 text-2xl font-bold text-gray-900'>
                  {formatCurrency(calculateColumnTotal('payment'))}
                </p>
              </CardContent>
            </Card>
            <Card className='shadow-md transition-shadow hover:shadow-lg'>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-700'>
                    {t('consultant.tracker.metrics.totalExpenses')}
                  </h3>
                  <BarChart className='h-6 w-6 text-red-600' />
                </div>
                <p className='mt-2 text-2xl font-bold text-gray-900'>
                  {formatCurrency(calculateTotalExpenses())}
                </p>
              </CardContent>
            </Card>
            <Card className='shadow-md transition-shadow hover:shadow-lg'>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-700'>
                    {t('consultant.tracker.metrics.effectiveBalance')}
                  </h3>
                  <Scale className='h-6 w-6 text-purple-600' />
                </div>
                <p className='mt-2 text-2xl font-bold text-gray-900'>
                  {formatCurrency(calculateColumnTotal('effectiveBalance'))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Expenses by Month */}
          <ExpensesByMonth
            activeYear={activeYear}
            salaryData={salaryData}
            expenseRows={expenseRows}
            //@ts-ignore
            calculateColumnTotal={calculateColumnTotal}
            formatCurrency={formatCurrency}
            t={t}
          />
        </div>
      )}
    </div>
  );
}