import { toast } from 'sonner';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

interface LaravelErrorResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  code?: number;
}

/**
 * Applies a Laravel-style 422 validation error response ({errors: {field: [msg]}})
 * onto a react-hook-form instance, and toasts a summary. Falls back to a plain
 * toast when the response has no field-level errors (404/500/network).
 *
 * Returns true if field-level errors were applied, false otherwise.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>,
  fallbackMessage = "Une erreur est survenue"
): boolean {
  const response = (error as { response?: { data?: LaravelErrorResponse } })?.response;
  const data = response?.data;
  const errors = data?.errors;

  if (errors && Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, messages]) => {
      const message = Array.isArray(messages) ? messages[0] : String(messages);
      form.setError(field as Path<T>, { type: 'server', message });
    });
    toast.error('Veuillez corriger les champs en erreur');
    return true;
  }

  toast.error(data?.message ?? fallbackMessage);
  return false;
}
