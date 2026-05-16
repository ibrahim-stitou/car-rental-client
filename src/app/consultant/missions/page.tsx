'use client';

import React from 'react';
import PageContainer from '@/components/layout/page-container';
import { MissionsCards } from '@/features/consultant/misisons/page';
import { useLanguage } from '@/context/LanguageContext';

const MissionsPage = () => {
  const { t } = useLanguage();

  return (
    <PageContainer>
      <div className="space-y-8 py-6 w-full">
        <h3 className="text-4xl font-bold text-gray-900">
          {t('consultant.missions.title')}
        </h3>
        <p className="text-gray-600 mt-2 mx-auto">
          {t('consultant.missions.subtitle')}
        </p>
        <MissionsCards />
      </div>
    </PageContainer>
  );
};

export default MissionsPage;