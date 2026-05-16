import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Suspense } from 'react';
import EmailCCListing from '@/features/settings/emails-cc/emails-cc-listing';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export const metadata = {
  title: 'Admin: Email CC Management'
};

export default function EmailCCPage() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={4} rowCount={5} filterCount={1} />
          }
        >
          <EmailCCListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}