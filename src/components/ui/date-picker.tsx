// src/components/ui/date-picker.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fr, enUS } from "date-fns/locale";

interface DatePickerProps {
  date?: Date;
  setDate: (date?: Date) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
                             date,
                             setDate,
                             className,
                             placeholder = "Select date",
                             disabled = false,
                           }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [locale, setLocale] = React.useState(enUS);

  // Get locale from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocale = localStorage.getItem('locale');
      setLocale(storedLocale === 'fr' ? fr : enUS);

      // Listen for locale changes
      const handleStorageChange = () => {
        const newLocale = localStorage.getItem('locale');
        setLocale(newLocale === 'fr' ? fr : enUS);
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const handleSelect = (selectedDate?: Date) => {
    setDate(selectedDate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}