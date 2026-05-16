'use client';
import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { UserNav } from './user-nav';
import { Maximize, Minimize } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex h-16 shrink-0 items-center justify-between gap-2',
        'bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg',
        'border-b border-gray-100 dark:border-gray-800',
        'transition-all duration-300 ease-in-out',
        'sticky top-0 z-50',
        'px-4 md:px-6',
        'group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
      )}
    >
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1 cursor-pointer hover:scale-110 transition-transform duration-200" />
        <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-gray-700" />
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFullscreen}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-full',
            'bg-gray-100 dark:bg-gray-800',
            'hover:bg-gray-200 dark:hover:bg-gray-700',
            'transition-colors duration-200'
          )}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </motion.button>
        <UserNav />
      </div>
    </motion.header>
  );
}
