'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Suspense } from 'react';
import BanksListing from '@/features/settings/banks/banks-listing';
import AddBankButton from '@/features/settings/banks/add-bank-button';

export default function Page() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Clean URL on component mount and whenever searchParams change
  useEffect(() => {
    // If there are any search parameters in the URL
    if (searchParams.toString()) {
      // Replace the current URL with a clean path
      window.history.replaceState({}, '', pathname);
    }
  }, [pathname, searchParams]);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Separator />
        <Suspense fallback={<div className="w-full h-64 flex items-center justify-center"></div>}>
          <BanksListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}