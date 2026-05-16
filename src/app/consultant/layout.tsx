import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Consultant Dashboard - Inginuity Extranet',
  description: 'Consultant-specific dashboard',
  icons: {
    icon: '/logo/small-logo-black.svg'
  }
};

export default async function ConsultantLayout({
                                                 children
                                               }: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen =true;

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}

