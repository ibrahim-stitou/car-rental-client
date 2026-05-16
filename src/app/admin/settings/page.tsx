'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, DollarSign, Building, MailIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import FkmTauxModal from '@/features/settings/fkm-settings/componenet/FkmTauxModal';

const SettingsPage = () => {
  const { t } = useLanguage();
  const [fkmModalOpen, setFkmModalOpen] = useState(false);

  const settingsOptions = [
    {
      title: t('admin.settings.options.daysOff'),
      icon: <Calendar size={18} className="text-purple-700" />,
      link: '/admin/settings/days-off',
    },
    {
      title: t('admin.settings.options.banks'),
      icon: <Building size={18} className="text-purple-700" />,
      link: '/admin/settings/banks',
    },
    {
      title: t('admin.settings.options.categoryExpense'),
      icon: <DollarSign size={18} className="text-purple-700" />,
      link: '/admin/settings/expense',
    },
    {
      title: t('admin.settings.options.fkmFee'),
      icon: <DollarSign size={18} className="text-purple-700" />,
      onClick: () => setFkmModalOpen(true),
    },{
      title: t('admin.settings.options.emailscc'),
      icon: <MailIcon size={18} className="text-purple-700" />,
      link: '/admin/settings/emails-cc',
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-black mb-4">{t('admin.settings.title')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {settingsOptions.map((option) =>
          option.link ? (
            <Link href={option.link} key={option.title}>
              <div className="bg-purple-50 p-2 rounded-md shadow-sm border border-purple-100 hover:shadow-sm transition-shadow duration-200 flex flex-col items-center justify-center h-24 w-full">
                <div className="bg-purple-100 p-1.5 rounded-full mb-2">
                  {option.icon}
                </div>
                <h3 className="text-center text-purple-800 text-xs font-medium">{option.title}</h3>
              </div>
            </Link>
          ) : (
            <div
              key={option.title}
              className="bg-purple-50 p-2 rounded-md shadow-sm border border-purple-100 hover:shadow-sm transition-shadow duration-200 flex flex-col items-center justify-center h-24 w-full cursor-pointer"
              onClick={option.onClick}
            >
              <div className="bg-purple-100 p-1.5 rounded-full mb-2">
                {option.icon}
              </div>
              <h3 className="text-center text-purple-800 text-xs font-medium">{option.title}</h3>
            </div>
          )
        )}
      </div>
      <FkmTauxModal open={fkmModalOpen} onClose={() => setFkmModalOpen(false)} />
    </div>
  );
};

export default SettingsPage;