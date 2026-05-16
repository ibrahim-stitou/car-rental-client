// src/components/layout/app-sidebar.tsx
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navItems, consultantNavItems } from '@/constants/data';
import { useReviewCounts } from '@/hooks/useReviewCounts';
import {
  IconChevronRight,
  IconChevronsDown,
  IconLogout
} from '@tabler/icons-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useLanguage } from '@/context/LanguageContext';
import { useSidebar } from '@/components/ui/sidebar'
import { useEffect } from 'react';
import Logowhite from '@/components/logowhite';

const tenants = [
  { id: '', name: '' },
];

export default function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { t } = useLanguage();
  const { state } = useSidebar();

  const isAdmin = session?.user?.role?.code === 'admin';

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { counts, loading } = isAdmin ? useReviewCounts() : { counts: {}, loading: false };
  const getBadgeCount = (itemTitle: string) => {
    if (!isAdmin || loading) return 0;

    switch (itemTitle.toLowerCase()) {
      case 'expenses':
        return counts.expenses;
      case 'mileage-expenses':
        return counts.mileage_expenses;
      case 'timesheets':
        return counts.timesheets;
      case 'rechargeable_expenses':
        return counts.rechargeable_expenses;
      default:
        return 0;
    }
  };

  //@ts-ignore
  const navItemsToUse = isAdmin ? navItems : consultantNavItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full px-4"
        >
          <div className={`flex items-center justify-center w-full ${state=="expanded" ? 'h-24' : 'h-12'}`}>
            <Link href={ isAdmin ? "/admin/overview" : "/consultant/overview" }>
              {state=="expanded" ? (
                // Larger logo when expanded
                <Logowhite className="w-40 h-auto" />

              ) : (
                <img
                  src="/logo/small-logo.svg"
                  alt="Logo"
                  className="w-9 h-9 object-contain transition-all duration-300 animate-fade-in"
                />
              )}
            </Link>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarMenu>
            {navItemsToUse.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const badgeCount = getBadgeCount(item.title);

              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={t(`sidebar.${item.title.toLowerCase()}`)}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon className="w-6 h-6" />}
                        <span>{t(`sidebar.${item.title.toLowerCase()}`)}</span>
                        {badgeCount > 0 && (
                          <SidebarMenuBadge className="bg-red-500 text-white">
                            {badgeCount}
                          </SidebarMenuBadge>
                        )}
                        <IconChevronRight className="ml-auto w-5 h-5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const subItemBadgeCount = getBadgeCount(subItem.title);

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url} className="relative">
                                  <span>{t(`sidebar.${subItem.title.toLowerCase()}`)}</span>
                                  {subItemBadgeCount > 0 && (
                                    <span className="absolute right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-5 text-center">
                                      {subItemBadgeCount}
                                    </span>
                                  )}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={t(`sidebar.${item.title.toLowerCase()}`)}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url} className="relative">
                      <Icon className="w-10 h-10 font-bold" />
                      <span className="text-bold">{t(`sidebar.${item.title.toLowerCase()}`)}</span>
                      {badgeCount > 0 && (
                        <SidebarMenuBadge className="bg-red-500 text-white">
                          {badgeCount}
                        </SidebarMenuBadge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={session?.user?.image || ''}
                      alt={session?.user?.name || ''}
                    />
                    <AvatarFallback className="rounded-lg">
                      {session?.user?.name?.slice(0, 2)?.toUpperCase() || 'CN'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user?.name || ''}
                    </span>
                    <span className="truncate text-xs">
                      {session?.user?.email || ''}
                    </span>
                  </div>
                  <IconChevronsDown className="ml-auto w-5 h-5" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={session?.user?.image || ''}
                        alt={session?.user?.name || ''}
                      />
                      <AvatarFallback className="rounded-lg">
                        {session?.user?.name?.slice(0, 2)?.toUpperCase() ||
                          'CN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {session?.user?.name || ''}
                      </span>
                      <span className="truncate text-xs">
                        {session?.user?.email || ''}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = '/api/auth/logout';
                  }}
                >
                  <IconLogout className="mr-2 w-5 h-5" />
                  {t('sidebar.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}