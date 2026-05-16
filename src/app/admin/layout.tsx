import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Inginuity Extranet',
  description: 'Inginuit-Extranet App',
  icons: {
    icon: '/logo/small-logo-black.svg'
  }
};

export default async function AdminLayout({
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