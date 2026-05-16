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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import { Shield } from 'lucide-react';

export function UserNav() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-10 w-10 shadow-2xl cursor-pointer">
            <AvatarImage
              src={session.user?.avatarUrl ?? ''}
              alt={`${session.user?.firstName} ${session.user?.lastName}`}
            />
            <AvatarFallback>
              {`${session.user?.firstName?.[0] ?? ''}${session.user?.lastName?.[0] ?? ''}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={10} forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {`${session.user?.firstName} ${session.user?.lastName}`}
            </p>
            <p className="text-muted-foreground text-xs leading-none">{session.user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => window.location.href = '/security'}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Security</span>
            <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          Logout
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
