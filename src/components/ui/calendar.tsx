'use client';

import * as React from 'react';
import { DayPicker, CaptionProps } from 'react-day-picker';
import type { ComponentProps } from 'react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LeftIcon = () => <ChevronLeftIcon className='size-4' />;
const RightIcon = () => <ChevronRightIcon className='size-4' />;

function CustomCaption({
                         displayMonth,
                         currMonth,
                         setCurrMonth,
                         locale,
                         fromYear = 1900,
                         toYear = new Date().getFullYear()
                       }: CaptionProps & {
  currMonth: Date,
  setCurrMonth: (date: Date) => void,
  locale: any,
  fromYear?: number,
  toYear?: number
}) {
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currMonth.getFullYear(), i);
    return {
      value: i.toString(),
      label: format(date, 'MMMM', { locale })
    };
  });

  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => (fromYear + i).toString()
  );

  const handleMonthChange = (month: string) => {
    const newMonth = new Date(currMonth);
    newMonth.setMonth(parseInt(month));
    setCurrMonth(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(currMonth);
    newMonth.setFullYear(parseInt(year));
    setCurrMonth(newMonth);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Select
        value={currMonth.getMonth().toString()}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="h-8 w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currMonth.getFullYear().toString()}
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="h-8 w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Calendar({
                    className,
                    classNames,
                    showOutsideDays = true,
                    locale: propLocale,
                    captionLayout = "dropdown-buttons",
                    fromYear = 1900,
                    toYear = new Date().getFullYear() + 10,
                    month,
                    onMonthChange,
                    disableNavigation,
                    ...props
                  }: ComponentProps<typeof DayPicker> & {
  fromYear?: number;
  toYear?: number;
}) {
  const getLocale = () => {
    if (propLocale) return propLocale;
    if (typeof window !== 'undefined') {
      const storedLocale = localStorage.getItem('locale');
      return storedLocale === 'fr' ? fr : enUS;
    }
    return enUS;
  };

  const [locale, setLocale] = React.useState(getLocale);
  const [currMonth, setCurrMonth] = React.useState<Date>(month || props.defaultMonth || new Date());

  React.useEffect(() => {
    const handleStorageChange = () => {
      setLocale(getLocale());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      const interval = setInterval(() => {
        const newLocale = getLocale();
        setLocale(prev => {
          const prevIsFr = prev === fr;
          const newIsFr = newLocale === fr;
          return prevIsFr !== newIsFr ? newLocale : prev;
        });
      }, 100);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [propLocale]);

  React.useEffect(() => {
    if (month) {
      setCurrMonth(month);
    }
  }, [month]);

  const handleMonthChange = (newMonth: Date) => {
    if (!disableNavigation) {
      setCurrMonth(newMonth);
      onMonthChange?.(newMonth);
    }
  };

  const CustomCaptionElement = React.useCallback(
    (captionProps: CaptionProps) => (
      <CustomCaption
        {...captionProps}
        currMonth={currMonth}
        setCurrMonth={handleMonthChange}
        locale={locale}
        fromYear={fromYear}
        toYear={toYear}
      />
    ),
    [currMonth, locale, fromYear, toYear, disableNavigation, onMonthChange]
  );

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      locale={locale}
      month={currMonth}
      onMonthChange={disableNavigation ? undefined : handleMonthChange}
      captionLayout={captionLayout}
      components={{
        IconLeft: LeftIcon,
        IconRight: RightIcon,
        ...(captionLayout === "dropdown-buttons" ? { Caption: CustomCaptionElement } : {})
      }}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          disableNavigation && 'pointer-events-none opacity-25'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-x-1',
        head_row: 'flex',
        head_cell:
          'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_start:
          'day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground',
        day_range_end:
          'day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground aria-selected:text-muted-foreground',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames
      }}
      {...props}
    />
  );
}

export { Calendar };