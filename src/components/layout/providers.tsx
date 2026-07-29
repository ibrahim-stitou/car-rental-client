'use client';
import React, { useEffect, useState } from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
import { SessionProvider, SessionProviderProps, useSession, signOut } from 'next-auth/react';
import { ActiveThemeProvider } from '../active-theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ProvidersProps {
  session: SessionProviderProps['session'];
  activeThemeValue: string;
  children: React.ReactNode;
}

/**
 * The jwt callback (see auth.config.ts) tries to silently refresh the
 * backend access token before it expires and flags session.error when that
 * refresh fails (e.g. the backend refresh window itself has lapsed). There's
 * no valid token to recover at that point, so force a real sign-out rather
 * than let the app keep making API calls that will all 401.
 */
function SessionErrorWatcher() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signOut({ redirect: true, callbackUrl: '/?reason=session_expired' });
    }
  }, [session?.error]);

  return null;
}

export default function Providers({ session, activeThemeValue, children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
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
            <SessionErrorWatcher />
            {children}
          </SessionProvider>
        </ActiveThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
