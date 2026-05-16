import { format } from 'date-fns';
import { enUS, fr, Locale } from 'date-fns/locale';

const locales: Record<string, Locale> = {
  en: enUS,
  fr: fr,
};

export function getDateLocale(language: string): Locale {
  return locales[language] || enUS;
}


export function dFormat(date: Date | string, formatString: string, language: string): string {
  const locale = getDateLocale(language);
  return format(new Date(date), formatString, { locale });
}
