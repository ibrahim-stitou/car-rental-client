import { Suspense } from 'react';
import { searchParamsCache, serialize } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { InvoiceListing } from '@/features/Subcontractor-Invoice/subcontractor-Invoice-listing';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Admin: Subcontractor Invoices'
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
      <div className="flex flex-1 flex-col space-y-4">
        <Suspense
          key={key}
          fallback={
            <DataTableSkeleton columnCount={8} rowCount={8} filterCount={4} />
          }
        >
          <InvoiceListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}