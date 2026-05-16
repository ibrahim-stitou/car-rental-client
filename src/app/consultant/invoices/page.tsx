import { Suspense } from 'react';
import { searchParamsCache, serialize } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { InvoiceListing } from '@/features/consultant/invoice/invoice-listing';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export const metadata = {
  title: 'Consultant: Invoices'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  const key = serialize({ ...searchParams });

  return (
    <Suspense
      key={key}
      fallback={
        <DataTableSkeleton columnCount={6} rowCount={8} filterCount={3} />
      }
    >
      <InvoiceListing />
    </Suspense>
  );
}