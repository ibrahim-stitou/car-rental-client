'use client';
import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { UserNav } from './user-nav';
import { NotificationBell } from './notification-bell';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { Maximize, Minimize, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useKBar } from 'kbar';

function SearchButton() {
  const { query } = useKBar();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={query.toggle}
      className={cn(
        'hidden md:flex items-center gap-2 h-8 px-3',
        'text-muted-foreground text-xs',
        'border-dashed hover:border-solid hover:text-foreground',
        'transition-all duration-200'
      )}
    >
      <Search className="h-3.5 w-3.5" />
      <span>Rechercher…</span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}

export default function Header() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'flex h-14 shrink-0 items-center justify-between gap-2',
        'bg-background/80 backdrop-blur-lg',
        'border-b border-border/60',
        'sticky top-0 z-50 px-3 md:px-4',
        'group-has-data-[collapsible=icon]/sidebar-wrapper:h-12',
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 h-8 w-8 cursor-pointer hover:scale-105 transition-transform duration-150" />
        <Separator orientation="vertical" className="h-5" />
        <Breadcrumbs />
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <SearchButton />

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:bg-accent"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>

        {/* Theme */}
        <ModeToggle />

        {/* Notifications */}
        <NotificationBell />

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* User */}
        <UserNav />
      </div>
    </motion.header>
  );
}
