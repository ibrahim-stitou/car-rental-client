import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import ClienView from '@/features/clients/client-view-page';

export const metadata = {
  title: 'Admin : Clients View'
};

type PageProps = { params: Promise<{ clientId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ClienView params={{ clientId: params.clientId }} />
        </Suspense>
      </div>
      
    </PageContainer>
  );
}
