'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { UserListing } from '@/features/users/components/user-listing';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function UsersPage() {
  const { t } = useLanguage();

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={t('admin.users.title')}
            description={t('admin.users.description')}
          />
          <Button asChild>
            <Link href="/admin/users/new">
              <Plus className="mr-2 h-4 w-4" /> {t('admin.users.addNew')}
            </Link>
          </Button>
        </div>
        <Separator />
        <UserListing />
      </div>
    </PageContainer>
  );
}