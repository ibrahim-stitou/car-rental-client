
import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { searchParamsCache, serialize } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { MileageExpenseListing } from '@/features/consultant/mileage-expenses/mileage-expense-listing';

export const metadata = {
  title: 'Consultant: Mileage Expenses',
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
      <Suspense
        key={key}
        fallback={<DataTableSkeleton columnCount={8} rowCount={8} filterCount={4} />}
      >
        <MileageExpenseListing />
      </Suspense>
    </PageContainer>
  );
}