'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface SelectFieldOption {
  value: string;
  label: string;
  sub?: string;
}

interface SelectFieldProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  /** Enables a "Créer <search>" row when no option matches; onCreateNew receives the typed text. */
  onCreateNew?: (search: string) => void;
}

/**
 * Generic searchable select built on Command/Popover, extracted from the
 * duplicated SearchableSelect in reservation-form.tsx / reservation-create-view.tsx.
 */
export function SelectField({
  value, onChange, options, placeholder = 'Sélectionner…',
  searchPlaceholder = 'Rechercher…', emptyText = 'Aucun résultat',
  disabled, className, onCreateNew,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sub ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find(o => o.value === value);
  const canCreate = !!onCreateNew && search.trim().length > 0 &&
    !options.some(o => o.label.toLowerCase() === search.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn('w-full justify-between font-normal h-10', !value && 'text-muted-foreground', className)}
          disabled={disabled}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {canCreate ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                  onClick={() => { onCreateNew?.(search.trim()); setOpen(false); setSearch(''); }}
                >
                  <Plus className="h-3.5 w-3.5" /> Créer « {search.trim()} »
                </button>
              ) : emptyText}
            </CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 100).map(item => (
                <CommandItem key={item.value} value={item.value}
                  onSelect={v => { onChange(v); setOpen(false); setSearch(''); }}>
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    {item.sub && <div className="text-xs text-muted-foreground">{item.sub}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {canCreate && filtered.length > 0 && (
              <div className="border-t p-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                  onClick={() => { onCreateNew?.(search.trim()); setOpen(false); setSearch(''); }}
                >
                  <Plus className="h-3.5 w-3.5" /> Créer « {search.trim()} »
                </button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
