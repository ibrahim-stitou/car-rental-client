import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import ProfileViewPage from '@/features/consultant/profile/profile-view-page';

export const metadata = {
  title: 'Consultant: My Profile'
};


export default async function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ProfileViewPage/>
        </Suspense>
      </div>
    </PageContainer>
  );
}
