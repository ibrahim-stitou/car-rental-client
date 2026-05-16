'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { ActiveThemeProvider } from '../active-theme';

interface ProvidersProps {
  session: SessionProviderProps['session'];
  activeThemeValue: string;
  children: React.ReactNode;
}

export default function Providers({ session, activeThemeValue, children }: ProvidersProps) {
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
          {children}
        </SessionProvider>
      </ActiveThemeProvider>
    </ThemeProvider>
  );
}
