import React, { useEffect } from 'react';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@/components/ui/command';
import { UseFormReturn } from 'react-hook-form';
import { useLanguage } from '@/context/LanguageContext';

const TrackerLabelSelect = ({
  name,
  form,
  label,
  placeholder,
  required = false
}: {
  name: string;
  form: UseFormReturn<any>;
  label?: string;
  placeholder?: string;
  required?: boolean;
}) => {
  const [labels, setLabels] = React.useState<
    { value: number; label: string }[]
  >([]);
  const [open, setOpen] = React.useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    apiClient
      .get(apiRoutes.admin.trackers.labels)
      .then((response) => setLabels(response.data.labels));
  }, []);
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-col'>
          {label && <FormLabel aria-required={required}>{label}</FormLabel>}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant='outline'
                  role='combobox'
                  className={cn(
                    'w-full justify-between',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value
                    ? labels.find((c) => c.value.toString() === field.value)
                        ?.label
                    : placeholder}
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className='w-full p-0' align='start'>
              <Command>
                <CommandInput placeholder={t('common.loading')} />
                <CommandEmpty>{t('common.noData')}</CommandEmpty>
                <CommandGroup className='max-h-64 overflow-y-auto'>
                  <CommandItem
                    value=""
                    onSelect={() => {
                      form.setValue(name, "");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        !field.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {placeholder || t('common.none')}
                  </CommandItem>
                  {labels.map((label) => (
                    <CommandItem
                      value={`${label.value}-${label.label}`}
                      key={label.value}
                      onSelect={() => {
                        form.setValue(name, label.value.toString());
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          label.value.toString() === field.value
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {label.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TrackerLabelSelect;
