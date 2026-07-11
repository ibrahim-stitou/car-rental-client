import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { APP_NAME } from '@/config/brand';

export const metadata: Metadata = {
  title: `${APP_NAME} Management`,
  description: `${APP_NAME} Fleet & Operations Management System`,
  icons: {
    icon: '/logo/small-logo-black.svg',
  },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <KBar>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
