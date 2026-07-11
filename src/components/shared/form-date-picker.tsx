'use client';

import { parseISO, format, isValid } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';

interface FormDatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Wraps the ui/date-picker Date-based DatePicker for react-hook-form fields
 * that store an ISO date string (yyyy-MM-dd), as used across insurance,
 * technical-inspection, vignette, maintenance and expense forms.
 */
export function FormDatePicker({ value, onChange, placeholder, disabled, className }: FormDatePickerProps) {
  const parsed = value ? parseISO(value) : undefined;
  const date = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <DatePicker
      date={date}
      setDate={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : '')}
      placeholder={placeholder ?? 'Choisir une date'}
      disabled={disabled}
      className={className}
    />
  );
}
