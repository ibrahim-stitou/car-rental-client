import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

export function dFormat(date: Date | string, formatString: string): string {
  return format(new Date(date), formatString, { locale: enUS });
}
