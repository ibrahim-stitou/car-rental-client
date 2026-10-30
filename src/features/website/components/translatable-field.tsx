'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Locale, Translatable } from '@/types/website.types';
import { LOCALES } from '../constants';

interface Props {
  label: string;
  value: Translatable | string | null | undefined;
  onChange: (value: Translatable) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  description?: string;
  /** Langues obligatoires pour la publication : marquées d'un astérisque. */
  required?: Locale[];
  error?: string;
}

/** Un ancien réglage peut être une simple chaîne : il devient le texte français. */
export function toTranslatable(value: Translatable | string | null | undefined): Translatable {
  if (!value) return {};
  return typeof value === 'string' ? { fr: value } : value;
}

/**
 * Saisie d'un texte du site en français, arabe (RTL) et anglais.
 */
export function TranslatableField({ label, value, onChange, multiline, rows = 3, maxLength, description, required = [], error }: Props) {
  const current = toTranslatable(value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="space-y-2">
        {LOCALES.map(({ value: locale, dir }) => {
          const text = current[locale] ?? '';
          const props = {
            dir,
            value: text,
            maxLength,
            placeholder: { fr: 'Français', ar: 'العربية', en: 'English' }[locale],
            className: cn(dir === 'rtl' && 'text-right font-[system-ui]'),
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChange({ ...current, [locale]: e.target.value }),
          };

          return (
            <div key={locale} className="flex gap-2 items-start">
              <span className={cn(
                'mt-2 w-9 shrink-0 rounded border px-1 py-0.5 text-center text-[10px] font-semibold uppercase',
                !text && required.includes(locale) ? 'border-amber-300 bg-amber-50 text-amber-700' : 'text-muted-foreground'
              )}>
                {locale}{required.includes(locale) && '*'}
              </span>
              <div className="flex-1">
                {multiline ? <Textarea rows={rows} {...props} /> : <Input {...props} />}
                {maxLength && multiline && (
                  <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{text.length}/{maxLength}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
