'use client';

import { use } from 'react';
import { useRole } from '@/features/roles/hooks/use-roles';
import { RoleFormView } from '@/features/roles/components/role-form-view';
import { Skeleton } from '@/components/ui/skeleton';
import PageContainer from '@/components/layout/page-container';

interface Props { params: Promise<{ id: string }> }

export default function RoleDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading } = useRole(id);
  const role = data?.data ?? null;

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

  return <RoleFormView role={role} />;
}
