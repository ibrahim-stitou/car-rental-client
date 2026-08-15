'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

/**
 * Date + time picker producing a "yyyy-MM-ddTHH:mm" string (same shape as a
 * native datetime-local input) via a Calendar popover + separate time input,
 * so pickup/return dates are always picked the same way across the
 * reservation creation form and the extend (prolongation) dialog.
 */
export function DateTimeField({
  label, value, onChange, placeholder, minDate,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; minDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const timeValue = parsed ? format(parsed, 'HH:mm') : '12:00';

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline"
                    className={cn('flex-1 justify-start text-left font-normal h-10', !value && 'text-muted-foreground')}>
              <Calendar className="mr-2 h-4 w-4" />
              {parsed ? format(parsed, 'dd/MM/yyyy', { locale: fr }) : (placeholder ?? 'Choisir une date')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarUI
              mode="single"
              selected={parsed}
              onSelect={d => {
                if (d) {
                  const [h, m] = timeValue.split(':').map(Number);
                  d.setHours(h, m);
                  onChange(format(d, "yyyy-MM-dd'T'HH:mm"));
                  setOpen(false);
                }
              }}
              initialFocus
              disabled={d => !!minDate && d < minDate}
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          className="w-28 h-10"
          value={timeValue}
          onChange={e => {
            const base = parsed ?? new Date();
            const [h, m] = e.target.value.split(':').map(Number);
            base.setHours(h, m);
            onChange(format(base, "yyyy-MM-dd'T'HH:mm"));
          }}
        />
      </div>
    </div>
  );
}
