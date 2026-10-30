'use client';

import { Copy, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { OpeningHours, OpeningSlot } from '@/types/website.types';
import { WEEK_DAYS } from '../constants';

const MAX_SLOTS = 3;
const DEFAULT_SLOT: OpeningSlot = { open: '09:00', close: '19:00' };

interface Props {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
}

/** Créneaux d'ouverture par jour ; un jour sans créneau est fermé. */
export function OpeningHoursEditor({ value, onChange }: Props) {
  const setDay = (day: keyof OpeningHours, slots: OpeningSlot[]) => onChange({ ...value, [day]: slots });

  const copyToAll = (day: keyof OpeningHours) => {
    const slots = value[day] ?? [];
    onChange(Object.fromEntries(WEEK_DAYS.map((d) => [d.value, slots.map((s) => ({ ...s }))])));
  };

  return (
    <div className="space-y-2">
      {WEEK_DAYS.map(({ value: day, label }) => {
        const slots = value[day] ?? [];
        const isOpen = slots.length > 0;

        return (
          <div key={day} className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2">
            <div className="flex w-32 items-center gap-2">
              <Switch checked={isOpen} onCheckedChange={(c) => setDay(day, c ? [{ ...DEFAULT_SLOT }] : [])} />
              <span className="text-sm font-medium">{label}</span>
            </div>

            {isOpen ? (
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Input type="time" value={slot.open} className="h-8 w-[6.5rem]"
                      onChange={(e) => setDay(day, slots.map((s, j) => (j === i ? { ...s, open: e.target.value } : s)))} />
                    <span className="text-muted-foreground">–</span>
                    <Input type="time" value={slot.close} className="h-8 w-[6.5rem]"
                      onChange={(e) => setDay(day, slots.map((s, j) => (j === i ? { ...s, close: e.target.value } : s)))} />
                    {slots.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={() => setDay(day, slots.filter((_, j) => j !== i))}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                {slots.length < MAX_SLOTS && (
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs"
                    onClick={() => setDay(day, [...slots, { open: '14:00', close: '19:00' }])}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Créneau
                  </Button>
                )}
              </div>
            ) : (
              <span className="flex-1 text-sm text-muted-foreground">Fermé</span>
            )}

            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => copyToAll(day)}>
              <Copy className="h-3.5 w-3.5 mr-1" />Appliquer à tous
            </Button>
          </div>
        );
      })}
    </div>
  );
}
