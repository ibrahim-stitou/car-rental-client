import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

export function dFormat(date: Date | string, formatString: string): string {
  return format(new Date(date), formatString, { locale: enUS });
}

/**
 * Formats a Date as a plain 'yyyy-MM-dd' string using its LOCAL calendar
 * date. Never use `date.toISOString().split('T')[0]` for this: toISOString
 * converts to UTC first, which shifts the date by one day whenever the
 * browser's local offset is non-zero (e.g. Africa/Casablanca is UTC+1
 * outside Ramadan) — a date picked/intended as "today" can silently become
 * "yesterday" once sent to the backend.
 */
export function dateOnlyLocal(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
