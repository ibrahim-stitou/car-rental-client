'use client';

import PageContainer from '@/components/layout/page-container';
import React from 'react';
import ProfessionalSalaryTracker from '@/app/consultant/overview/components/professional-tracker';

export default function OverViewLayout() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6 w-full'>
        <div className="grid grid-cols-1 gap-6">
          <ProfessionalSalaryTracker />
        </div>
      </div>
    </PageContainer>
  );
}