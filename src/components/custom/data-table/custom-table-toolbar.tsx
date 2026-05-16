'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CustomDataTableSelect } from '@/components/custom/data-table/custom-datatable-select';

import { Cross2Icon, CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { CalendarIcon, Settings2 } from 'lucide-react';

import { CustomTableFilterConfig, UseCustomTableReturnType } from '@/components/custom/data-table/types';
import { Calendar } from '@/components/ui/calendar';
import { dFormat } from '@/utils/date-utils';
import { enUS } from 'date-fns/locale';

interface CustomTableToolbarProps<TData extends Record<string, any>>
  extends React.ComponentProps<'div'> {
  table: UseCustomTableReturnType<TData>;
  filters?: CustomTableFilterConfig[];
}

export function CustomTableToolbar<TData extends Record<string, any>>({
  table,
  filters = [],
  className,
  ...props
}: CustomTableToolbarProps<TData>) {
  const defaultValues = useMemo(() => {
    return filters.reduce<Record<string, any>>((acc, filter) => {
      acc[filter.field] = filter.defaultValue ?? '';
      return acc;
    }, {});
  }, [filters]);

  const filterSchema = useMemo(() => {
    const schema: Record<string, z.ZodTypeAny> = {};
    filters.forEach((filter) => {
      schema[filter.field] =
        filter.type === 'text' ? z.string().nullable() :
          filter.type === 'number' ? z.union([z.number(), z.string()]).nullable() :
            filter.type === 'date' ? z.string().nullable() :
              filter.type === 'select' ? z.any().nullable() :
                filter.type === 'checkbox' ? z.boolean().nullable() :
                  z.any().nullable();
    });
    return z.object(schema);
  }, [filters]);

  const methods = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues,
    mode: 'onSubmit',
  });

  const { handleSubmit, reset, control } = methods;

  const handleApplyFilters = handleSubmit((values) => {
    table.onFilter(values);
  });

  const handleResetFilters = () => {
    reset(defaultValues);
    table.onFilter({});
  };

  const isFiltered = useMemo(() => {
    return Object.values(table.filters || {}).some(
      (v) => v !== '' && v !== null && v !== undefined
    );
  }, [table.filters]);

  const renderFilter = (filter: CustomTableFilterConfig) => {
    const name = filter.field as never;

    switch (filter.type) {
      case 'text':
      case 'number':
        return (
          <FormField
            control={control}
            name={name}
            render={({ field }) => (
              <Input
                {...field}
                type={filter.type}
                placeholder={filter.label}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        );
      case 'date':
        return (
          <FormField
            control={control}
            name={name}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? dFormat(new Date(field.value), 'PPP') : <span>{filter.label}</span>}
                    {field.value && (
                      <span
                        className="ml-auto flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          field.onChange(null);
                        }}
                      >
                        <Cross2Icon className="h-4 w-4 text-muted-foreground hover:text-red-500 cursor-pointer" />
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    locale={enUS}
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      if (date instanceof Date && !isNaN(date.getTime())) {
                        field.onChange(date.toISOString());
                      } else {
                        field.onChange(null);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
        );
      case 'select':
        return (
          filter.options?.length && (
            <FormField
              control={control}
              name={name}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* @ts-ignore */}
                    <SelectItem value={null}>All</SelectItem>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )
        );

      case 'checkbox':
        return (
          <FormField
            control={control}
            name={name}
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox checked={!!field.value} onCheckedChange={field.onChange} id={filter.field} />
                </FormControl>
                <FormLabel htmlFor={filter.field}>{filter.label}</FormLabel>
              </FormItem>
            )}
          />
        );

      case 'datatable-select':
      case 'datatable-multiselect':
        return <CustomDataTableSelect filter={filter} form={methods} />;

      case 'custom':
      default:
        return filter.render?.(methods) ?? null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div
        role="toolbar"
        aria-orientation="horizontal"
        className={cn('flex w-full items-start justify-between gap-2 p-1', className)}
        {...props}
      >
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <div key={filter.field} className="relative">
              {renderFilter(filter)}
            </div>
          ))}

          {filters.length > 0 && isFiltered && (
            <Button
              aria-label="Reset filters"
              variant="outline"
              size="sm"
              className="border-dashed"
              onClick={handleResetFilters}
            >
              <Cross2Icon className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}

          {filters.length > 0 && (
            <Button aria-label="Apply filters" size="sm" onClick={handleApplyFilters}>
              Apply
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="Toggle columns"
                role="combobox"
                variant="outline"
                size="sm"
                className="ml-auto hidden h-8 lg:flex"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Columns
                <CaretSortIcon className="ml-auto opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-0">
              <Command>
                <CommandInput placeholder="Search columns..." />
                <CommandList>
                  <CommandEmpty>No results</CommandEmpty>
                  <CommandGroup>
                    {table.columns.map((column) => (
                      <CommandItem
                        // @ts-ignore
                        key={column.data}
                        onSelect={() => {
                          const { data } = column;
                          const isVisible = table.visibleColumns.includes(data as keyof TData);
                          const newCols = isVisible
                            ? table.visibleColumns.filter((c) => c !== data)
                            : [...table.visibleColumns, data as keyof TData];
                          table.setVisibleColumns(newCols);
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            'mr-2 h-4 w-4',
                            table.visibleColumns.includes(column.data as keyof TData) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="truncate">{column.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </FormProvider>
  );
}
