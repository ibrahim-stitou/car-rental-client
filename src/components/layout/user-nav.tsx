'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { signOut, useSession } from 'next-auth/react';
import {
  IconUser, IconShield, IconBell, IconSettings, IconLogout,
  IconLayoutDashboard, IconCar, IconChevronDown,
} from '@tabler/icons-react';
import Link from 'next/link';

export function UserNav() {
  const { data: session } = useSession();

  if (!session) return null;

  const initials = `${session.user?.firstName?.[0] ?? ''}${session.user?.lastName?.[0] ?? ''}`.toUpperCase() || 'CR';
  const fullName = `${session.user?.firstName ?? ''} ${session.user?.lastName ?? ''}`.trim();
  const role = (session.user as any)?.role?.name ?? (session.user as any)?.roles?.[0] ?? '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-9 px-2 rounded-full hover:bg-accent transition-colors"
        >
          <Avatar className="h-7 w-7 border-2 border-primary/20 shadow-sm">
            <AvatarImage src={(session.user as any)?.avatarUrl ?? ''} alt={fullName} />
            <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-xs font-medium leading-none">{fullName || 'Utilisateur'}</span>
            {role && <span className="text-[10px] text-muted-foreground leading-none mt-0.5 capitalize">{role}</span>}
          </div>
          <IconChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60" align="end" sideOffset={8} forceMount>
        {/* Profile header */}
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={(session.user as any)?.avatarUrl ?? ''} alt={fullName} />
              <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none truncate">{fullName || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground leading-none truncate">{session.user?.email}</p>
              {role && (
                <Badge variant="secondary" className="mt-1 h-4 text-[10px] w-fit px-1.5 capitalize">{role}</Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer">
              <IconLayoutDashboard className="mr-2.5 h-4 w-4 text-muted-foreground" />
              <span>Tableau de bord</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <IconUser className="mr-2.5 h-4 w-4 text-muted-foreground" />
              <span>Mon profil</span>
              <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/notifications" className="cursor-pointer">
              <IconBell className="mr-2.5 h-4 w-4 text-muted-foreground" />
              <span>Notifications</span>
              <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/security" className="cursor-pointer">
              <IconShield className="mr-2.5 h-4 w-4 text-muted-foreground" />
              <span>Sécurité</span>
              <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <IconSettings className="mr-2.5 h-4 w-4 text-muted-foreground" />
              <span>Paramètres</span>
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          onClick={() => signOut({ callbackUrl: '/sign-in' })}
        >
          <IconLogout className="mr-2.5 h-4 w-4" />
          <span>Se déconnecter</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
