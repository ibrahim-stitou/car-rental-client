'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { ClientListing } from '@/features/clients/client-listing';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ClientsPage() {
  const { t } = useLanguage();

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={t('admin.clients.title') || 'Clients'}
            description={t('admin.clients.description') || 'Manage all clients'}
          />
          <Button asChild>
            <Link href="/admin/clients/new">
              <Plus className="mr-2 h-4 w-4" /> {t('admin.clients.addNew') || 'Add New Client'}
            </Link>
          </Button>
        </div>
        <Separator />
        <ClientListing />
      </div>
    </PageContainer>
  );
}