'use client';

import { use } from 'react';
import { useClient } from '@/features/clients/hooks/use-clients';
import { ClientForm } from '@/features/clients/components/client-form';
import { Skeleton } from '@/components/ui/skeleton';
import PageContainer from '@/components/layout/page-container';

interface Props { params: Promise<{ id: string }> }

export default function EditClientPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading } = useClient(id);
  const client = (data as any)?.data ?? null;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="p-6 w-full mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-8 w-48" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </PageContainer>
    );
  }

  return <ClientForm client={client} />;
}
