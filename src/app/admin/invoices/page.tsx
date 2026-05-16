import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { searchParamsCache, serialize } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { InvoiceListing } from '@/features/invoices/invoice-listing';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { useLanguage } from '@/context/LanguageContext';

export const metadata = {
  title: 'Admin: Invoices',
  description: 'Manage and view client invoices'
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
          <InvoiceListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}