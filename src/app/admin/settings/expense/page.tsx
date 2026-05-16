import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Suspense } from 'react';
import ExpenseListing from '@/features/settings/expense/expense-listing';

export const metadata = {
  title: 'Admin: Expense Management'
};

export default function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>

        <Suspense
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={1} />
          }
        >
          <ExpenseListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}