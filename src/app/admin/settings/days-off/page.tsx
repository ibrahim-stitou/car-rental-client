'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Suspense } from 'react';
import DaysOffListing from '@/features/settings/days-off/daysoff-listing';

export default function Page() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.toString()) {
      window.history.replaceState({}, '', pathname);
    }
  }, [pathname, searchParams]);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={8} filterCount={1} />
          }
        >
          <DaysOffListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}