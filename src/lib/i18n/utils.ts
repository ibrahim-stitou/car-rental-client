// src/lib/i18n/utils.ts
export function getCurrentLocale(): string {

  if (typeof window !== 'undefined') {
    return localStorage.getItem('locale') || 'fr';
  }


  return 'fr';
}