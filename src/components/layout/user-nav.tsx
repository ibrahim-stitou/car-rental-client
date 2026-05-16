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
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function UserNav() {
  const { data: session } = useSession();
  const router = useRouter();
  const {t}=useLanguage()

  const handleSecurityClick = () => {
    // @ts-ignore - Accès aux propriétés personnalisées du user
    if (session?.user?.role?.code === "admin") {
      router.push('/admin/security');
    } else {
      router.push('/consultant/security');
    }
  };

  if (session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-10 w-10 shadow-2xl cursor-pointer'>
              <AvatarImage
                //@ts-ignore
                src={session.user?.image ?? ''}
                alt={session.user?.name ?? ''}
              />
              <AvatarFallback>{session.user?.name?.[0]}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-56'
          align='end'
          sideOffset={10}
          forceMount
        >
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-medium'>
                {session.user?.name}
              </p>
              <p className='text-muted-foreground text-xs leading-none'>
                {session.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleSecurityClick}>
              <Shield className="mr-2 h-4 w-4" />
              <span>{t('common.security')}</span>
              <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            {t('common.logout')}
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}