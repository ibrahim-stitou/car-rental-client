import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { searchParamsCache, serialize } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { ExpenseListing } from '@/features/expenses/expense-listing';

export const metadata = {
  title: 'Admin: Expenses',
  description: 'Manage and view expense reports'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  const key = serialize({ ...searchParams });

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Suspense
          key={key}
          fallback={
            <DataTableSkeleton columnCount={8} rowCount={8} filterCount={4} />
          }
        >
          <ExpenseListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}