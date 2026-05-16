'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { ActiveThemeProvider } from '../active-theme';
import { I18nProvider } from '@/lib/i18n/context';

interface ProvidersProps {
  session: SessionProviderProps['session'];
  activeThemeValue: string;
  lang?: string;
  children: React.ReactNode;
}

export default function Providers({
                                    session,
                                    activeThemeValue,
                                    lang = 'en',
                                    children
                                  }: ProvidersProps) {
  // Effet pour synchroniser la langue avec localStorage
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedLang = localStorage.getItem('lang');
        if (!savedLang || savedLang !== lang) {
          localStorage.setItem('lang', lang);
        }
      }
    } catch (e) {
      console.error('Language persistence error:', e);
    }
  }, [lang]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <SessionProvider
          session={session}
          refetchInterval={5 * 60}
          refetchOnWindowFocus={true}
        >
          <I18nProvider lang={lang}>
            {children}
          </I18nProvider>
        </SessionProvider>
      </ActiveThemeProvider>
    </ThemeProvider>
  );
}