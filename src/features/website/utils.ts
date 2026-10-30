import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Translatable } from '@/types/website.types';
import { checklistLabel } from './constants';

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[] | string>;
}

/**
 * Affiche l'erreur d'un appel au module Site web. Un refus de publication
 * renvoie les points manquants dans errors.checklist : ils sont listés.
 */
export function toastWebsiteError(error: unknown, fallback = 'Une erreur est survenue') {
  const body = (error as { response?: { data?: ApiErrorBody } })?.response?.data;
  const checklist = body?.errors?.checklist;

  if (Array.isArray(checklist) && checklist.length > 0) {
    toast.error(body?.message ?? 'Publication impossible', {
      description: checklist.map((code) => `• ${checklistLabel(code)}`).join('\n'),
    });
    return;
  }

  const firstField = body?.errors ? Object.values(body.errors)[0] : undefined;
  const detail = Array.isArray(firstField) ? firstField[0] : firstField;
  toast.error(detail ?? body?.message ?? fallback);
}

/** Texte français d'un champ traduisible (repli sur la première langue remplie). */
export function frText(value: Translatable | string | null | undefined) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.fr || value.en || value.ar || '';
}

export function formatDateTime(value: string | null | undefined, pattern = 'dd MMM yyyy HH:mm') {
  if (!value) return '—';
  try { return format(parseISO(value), pattern, { locale: fr }); } catch { return '—'; }
}

export function formatMad(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString('fr-MA', { maximumFractionDigits: 2 })} MAD`;
}

/** Retire les clés vides pour ne pas écraser une traduction par une chaîne vide inutile. */
export function cleanTranslatable(value: Translatable | undefined | null): Translatable {
  const out: Translatable = {};
  for (const [key, text] of Object.entries(value ?? {})) {
    out[key as keyof Translatable] = text?.trim() ? text.trim() : null;
  }
  return out;
}
