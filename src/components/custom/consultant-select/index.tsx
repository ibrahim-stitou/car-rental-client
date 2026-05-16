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

const ConsultantSelect = ({
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
  const [consultants, setConsultants] = React.useState<
    { id: number; fullname: string }[]
  >([]);
  const [open, setOpen] = React.useState(false);

  const { t } = useLanguage();
  useEffect(() => {
    apiClient
      .get(apiRoutes.common.consultantList)
      .then((response) => setConsultants(response.data.data));
  }, []);
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-col'>
          {
            label&& <FormLabel aria-required={required}>{label}</FormLabel>
          }
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
                    ? consultants.find((c) => c.id.toString() === field.value)
                        ?.fullname
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
                  {consultants.map((user) => (
                    <CommandItem
                      value={`${user.id}-${user.fullname}`}
                      key={user.id}
                      onSelect={() => {
                        form.setValue(name, user.id.toString());
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          user.id.toString() === field.value
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {user.fullname}
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

export default ConsultantSelect;
