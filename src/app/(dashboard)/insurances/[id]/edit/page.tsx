'use client';

import { use } from 'react';
import { useInsurance } from '@/features/insurances/hooks/use-insurances';
import { InsuranceFormView } from '@/features/insurances/components/insurance-form-view';
import { Skeleton } from '@/components/ui/skeleton';
import PageContainer from '@/components/layout/page-container';

interface Props { params: Promise<{ id: string }> }

export default function EditInsurancePage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading } = useInsurance(id);
  const insurance = data?.data ?? null;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="p-6 w-full space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-8 w-48" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </PageContainer>
    );
  }

  return <InsuranceFormView insurance={insurance} />;
}
