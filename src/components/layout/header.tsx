'use client'
import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { UserNav } from './user-nav';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useLanguage } from '@/context/LanguageContext';
import { Maximize, Minimize, Languages } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Header() {
  const { t, language, handleLanguageChange } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const flagUrls = {
    en: 'https://flagcdn.com/w320/gb.png',
    fr: 'https://flagcdn.com/w320/fr.png',
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
      <div className='flex items-center gap-4'>
        <SidebarTrigger className='-ml-1 cursor-pointer hover:scale-110 transition-transform duration-200' />
        <Separator orientation='vertical' className='h-6 bg-gray-200 dark:bg-gray-700' />
        <Breadcrumbs  />
      </div>
<p className='text-2xl font-semibold text-primary dark:text-gray-200'>
  Stargate Payrolling
</p>
      <div className='flex items-center gap-3'>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFullscreen}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full",
            "bg-gray-100 dark:bg-gray-800",
            "hover:bg-gray-200 dark:hover:bg-gray-700",
            "transition-colors duration-200"
          )}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </motion.button>


        <UserNav />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-2 px-3 py-2',
                'text-sm font-medium',
                'border border-gray-200 dark:border-gray-700 rounded-xl',
                'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700',
                'shadow-sm hover:shadow',
                'transition-all duration-200'
              )}
            >
              <img
                src={flagUrls[language as keyof typeof flagUrls]}
                alt={language}
                className='w-5 h-5 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700'
              />
              <Languages size={16} className="text-gray-500 dark:text-gray-400" />
            </motion.button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className={cn(
              'w-44 p-1',
              'bg-white dark:bg-gray-900',
              'shadow-lg rounded-xl',
              'border border-gray-100 dark:border-gray-800'
            )}
          >
            <DropdownMenuItem
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 my-0.5 rounded-lg',
                'text-sm font-medium',
                'cursor-pointer',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                'transition-colors duration-150',
                language === 'en' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              )}
              onClick={() => handleLanguageChange('en')}
            >
              <img src={flagUrls.en} alt='English' className='w-5 h-5 rounded-full object-cover' />
              <span>English</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 my-0.5 rounded-lg',
                'text-sm font-medium',
                'cursor-pointer',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                'transition-colors duration-150',
                language === 'fr' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              )}
              onClick={() => handleLanguageChange('fr')}
            >
              <img src={flagUrls.fr} alt='Français' className='w-5 h-5 rounded-full object-cover' />
              <span>Français</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}