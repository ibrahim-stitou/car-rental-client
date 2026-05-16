// src/app/consultant/expenses/page.tsx
import PageContainer from '@/components/layout/page-container';
import { searchParamsCache, serialize } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { ConsultantExpenseListing } from '@/features/consultant/expenses/expense-listing';

export const metadata = {
  title: 'Consultant: Expenses',
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
        fallback={<DataTableSkeleton columnCount={6} rowCount={8} filterCount={4} />}
      >
        <ConsultantExpenseListing />
      </Suspense>
    </PageContainer>
  );
}