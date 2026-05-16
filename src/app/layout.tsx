import { auth } from '@/lib/auth';
import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/context/LanguageContext';
import type { Metadata, Viewport } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import NextTopLoader from 'nextjs-toploader';
import { cookies, headers } from 'next/headers';
import { cn } from '@/lib/utils';
import ThemeInitializer from '@/components/custom/ThemeInitialize';
import { fontVariables } from '@/lib/font';
import './globals.css';
import './theme.css';

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b'
};

export const metadata: Metadata = {
  title: 'Inginuity Extranet',
  description: 'Inginuty App Extranet for consultants',
  icons: {
    icon: '/logo/small-logo-black.svg'
  }

};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light
};

const SUPPORTED_LANGS = ['en', 'fr'] as const;
const DEFAULT_LANG = 'en';

export default async function RootLayout({
                                           children,
                                           params: { lang }
                                         }: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const activeThemeValue ='inginuity';
  const isScaled = false;
  // Language detection
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  const browserLang = acceptLanguage?.split(',')[0]?.split('-')[0];
  const validatedLang = SUPPORTED_LANGS.includes(lang as any)
    ? lang
    : SUPPORTED_LANGS.includes(browserLang as any)
      ? browserLang
      : DEFAULT_LANG;

  return (
    <html lang={validatedLang} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
      try {
        localStorage.theme = 'inginuity';
        document.documentElement.classList.add('theme-inginuity');
        if (localStorage.darkMode === 'true' ||
           (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
          document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '${META_THEME_COLORS.dark}');
        }
        if (!localStorage.lang || localStorage.lang !== '${validatedLang}') {
          localStorage.setItem('lang', '${validatedLang}');
        }
      } catch (e) {
        console.error('Erreur lors de l\'initialisation du thème:', e);
      }
    `
          }}
        />
      </head>
      <body
        className={cn(
          'bg-background overflow-hidden overscroll-none font-sans antialiased',
          'theme-inginuity',
          fontVariables
        )}
      >
        <NextTopLoader showSpinner={false} />
        <NuqsAdapter>
          <LanguageProvider>
            <Providers
              session={session}
              activeThemeValue={activeThemeValue}
              lang={validatedLang}
            >
              <ThemeInitializer />
              <Toaster />
              {children}
            </Providers>
          </LanguageProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}