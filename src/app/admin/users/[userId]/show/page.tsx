import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import UserViewPage from '@/features/users/components/user-view-page';

export const metadata = {
  title: 'Dashboard : Users View'
};

type PageProps = { params: Promise<{ userId: string }> };
export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <UserViewPage params={{ userId: params.userId }} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
