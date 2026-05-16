'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle, Users, Clock, Receipt, Car, CreditCard,
  DollarSign, Zap, ArrowUpRight, MoreVertical, UserPlus,
  FileText, Briefcase, FileDown
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import ExportTrackersModal from '@/features/tracker/components/export-trackers-modal';

interface DashboardCounts {
  timesheets_to_validate: number;
  expenses_to_validate: number;
  mileage_expenses_to_validate: number;
  rechargeable_expenses_to_validate: number;
  active_consultants: number;
  unpaid_invoices: number;
}

export default function ModernDashboard() {
  const [counts, setCounts] = useState<DashboardCounts>({
    timesheets_to_validate: 0,
    expenses_to_validate: 0,
    mileage_expenses_to_validate: 0,
    rechargeable_expenses_to_validate: 0,
    active_consultants: 0,
    unpaid_invoices: 0
  });

  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch dashboard counts from API
    const fetchDashboardCounts = async () => {
      try {
        const response = await apiClient.get(apiRoutes.admin.dashboardCounts);
        setCounts(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard counts:', err);
        setError(t('common.errors.fetchFailed'));
        setIsLoading(false);
      }
    };

    fetchDashboardCounts();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timeInterval);
    };
  }, [t]);

  const dashboardCards = [
    {
      title: t('admin.dashboard.timesheets_to_validate'),
      value: counts.timesheets_to_validate,
      icon: <Clock className="h-6 w-6" />,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      changePositive: true,
      route: '/admin/timesheets'
    },
    {
      title: t('admin.dashboard.expenses_to_validate'),
      value: counts.expenses_to_validate,
      icon: <Receipt className="h-6 w-6" />,
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      changePositive: false,
      route: '/admin/expenses'
    },
    {
      title: t('admin.dashboard.mileage_expenses_to_validate'),
      value: counts.mileage_expenses_to_validate,
      icon: <Car className="h-6 w-6" />,
      gradient: 'from-amber-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100',
      changePositive: true,
      route: '/admin/mileage-expenses'
    },
    {
      title: t('admin.dashboard.rechargeable_expenses_to_validate'),
      value: counts.rechargeable_expenses_to_validate,
      icon: <CreditCard className="h-6 w-6" />,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      changePositive: true,
      route: '/admin/rechargeable-expenses'
    },
    {
      title: t('admin.dashboard.active_consultants'),
      value: counts.active_consultants,
      icon: <Users className="h-6 w-6" />,
      gradient: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      changePositive: true,
      route: '/admin/users'
    },
    {
      title: t('admin.dashboard.unpaid_invoices'),
      value: counts.unpaid_invoices,
      icon: <DollarSign className="h-6 w-6" />,
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      changePositive: false,
      route: '/admin/invoices?filter=unpaid'
    }
  ];

  const quickActions = [
    {
      title: t('admin.dashboard.quickActions.newConsultant'),
      description: t('admin.dashboard.quickActions.newConsultantDesc'),
      icon: <UserPlus className="h-5 w-5" />,
      gradient: 'from-blue-500 to-blue-600',
      category: t('admin.dashboard.quickActions.categories.people'),
      route: '/admin/users/new'
    },
    {
      title: t('admin.dashboard.quickActions.newInvoice'),
      description: t('admin.dashboard.quickActions.newInvoiceDesc'),
      icon: <Receipt className="h-5 w-5" />,
      gradient: 'from-emerald-500 to-emerald-600',
      category: t('admin.dashboard.quickActions.categories.finance'),
      route: '/admin/invoices/new'
    },
    {
      title: t('admin.dashboard.quickActions.newContract'),
      description: t('admin.dashboard.quickActions.newContractDesc'),
      icon: <FileText className="h-5 w-5" />,
      gradient: 'from-purple-500 to-purple-600',
      category: t('admin.dashboard.quickActions.categories.legal'),
      route: '/admin/contracts/new'
    },
    {
      title: t('admin.dashboard.quickActions.newMission'),
      description: t('admin.dashboard.quickActions.newMissionDesc'),
      icon: <Briefcase className="h-5 w-5" />,
      gradient: 'from-amber-500 to-orange-500',
      category: t('admin.dashboard.quickActions.categories.projects'),
      route: '/admin/missions/new'
    }
  ];

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </div>
  );

  const handleCardClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {t('admin.dashboard.welcome')}
              </h1>
            </div>
            <Button
              onClick={() => setExportModalOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              <FileDown className="h-4 w-4" />
              {t('admin.dashboard.exportTrackers.buttonLabel')}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            dashboardCards.map((card, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
                onClick={() => handleCardClick(card.route)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick(card.route);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">{card.title}</p>
                    <div className="flex items-baseline space-x-3">
                      <h3 className="text-3xl font-bold text-gray-900">{card.value}</h3>
                    </div>
                  </div>
                  <div
                    className={`p-3 bg-gradient-to-r ${card.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {card.icon}
                    </div>
                  </div>
                </div>
                <div className={`h-2 ${card.bgColor} rounded-full overflow-hidden`}>
                  <div
                    className={`h-full bg-gradient-to-r ${card.gradient} rounded-full transition-all duration-1000 ease-out`}
                    style={{
                      width: `${Math.min((card.value / 50) * 100, 100)}%`,
                      animationDelay: `${index * 200 + 500}ms`
                    }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mr-3">

              </div>
              <h2 className="text-xl font-semibold text-gray-900">{t('admin.dashboard.quickActionsTitle')}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className="group relative p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                onClick={() => handleCardClick(action.route)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 bg-gradient-to-r ${action.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {action.icon}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {action.category}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {action.description}
                </p>
                <ArrowUpRight
                  className="h-4 w-4 text-gray-400 absolute top-4 right-4 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <ExportTrackersModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
      />

      <style jsx>{`
          @keyframes fadeInUp {
              from {
                  opacity: 0;
                  transform: translateY(30px);
              }
              to {
                  opacity: 1;
                  transform: translateY(0);
              }
          }
      `}</style>
    </div>
  );
}