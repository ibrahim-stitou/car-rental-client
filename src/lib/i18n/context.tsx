'use client';

import { createContext, useContext, ReactNode } from 'react';

type I18nContextType = {
  lang: string;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  t: (key) => key,
});

export function I18nProvider({ children, lang }: { children: ReactNode; lang: string }) {
  const t = (key: string) => key;

  return (
    <I18nContext.Provider value={{ lang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}