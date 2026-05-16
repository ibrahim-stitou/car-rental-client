import {TranslationKeys} from '../lib/i18n/types';

declare global {
  function __(key: TranslationKeys, values?: Record<string, any>): string;
}