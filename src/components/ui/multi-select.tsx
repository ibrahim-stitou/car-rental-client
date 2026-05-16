'use client'

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
                              options,
                              selected,
                              onChange,
                              placeholder = 'Select...',
                              className,
                            }: MultiSelectProps) {
  const toggleOption = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  const selectedLabels = options
    .filter((opt) => selected.includes(opt.value))
    .map((opt) => opt.label)
    .join(', ');

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          'border-input text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9',
          className
        )}
      >
        <span>{selected.length ? selectedLabels : placeholder}</span>
        <ChevronDownIcon className='size-4 opacity-50' />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className='z-50 mt-2 w-56 rounded-md border bg-popover p-2 shadow-md'
          sideOffset={4}
        >
          <div className='max-h-60 overflow-y-auto'>
            {options.map((option) => (
              <label
                key={option.value}
                className='flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-md hover:bg-accent'
              >
                <Checkbox.Root
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggleOption(option.value)}
                  className='flex h-4 w-4 shrink-0 items-center justify-center rounded border border-muted bg-background'
                >
                  <Checkbox.Indicator>
                    <CheckIcon className='h-3 w-3' />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                {option.label}
              </label>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
