'use client';

import { use } from 'react';
import { useTechnicalInspection } from '@/features/technical-inspections/hooks/use-technical-inspections';
import { TechnicalInspectionFormView } from '@/features/technical-inspections/components/technical-inspection-form-view';
import { Skeleton } from '@/components/ui/skeleton';
import PageContainer from '@/components/layout/page-container';

interface Props { params: Promise<{ id: string }> }

export default function EditTechnicalInspectionPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading } = useTechnicalInspection(id);
  const inspection = data?.data ?? null;

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

  return <TechnicalInspectionFormView inspection={inspection} />;
}
