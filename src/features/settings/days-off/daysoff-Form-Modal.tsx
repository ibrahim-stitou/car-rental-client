'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, X } from 'lucide-react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDaysOffStore } from '@/stores/days-off-store';
import { toast } from '@/components/ui/sonner';
import { DayOff } from '@/features/settings/days-off/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/context/LanguageContext';

const dayOptions = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, '0') }));
const monthOptions = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' }
];
const yearOptions = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: year, label: String(year) };
});
const dateSchema = z.object({
  day: z.number().min(1).max(31),
  month: z.number().min(0).max(11),
  year: z.number().optional()
});
const multiDaySchema = z.array(
  dateSchema
).optional();

const formatDateToYYYYMMDD = (dateValues: any, defaultYear = new Date().getFullYear()) => {
  const year = dateValues.year || defaultYear;
  const month = String(dateValues.month + 1).padStart(2, '0');
  const day = String(dateValues.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DayOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dayOff: DayOff | null;
  selectedCountry: number | null;
}

export function DayOffModal({
                              isOpen,
                              onClose,
                              onSuccess,
                              dayOff,
                              selectedCountry
                            }: DayOffModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  const { countries, fetchCountries, addDayOff, updateDayOff } = useDaysOffStore();
  const isEditing = !!dayOff;
  const filteredCountries = countries.filter(
    country => country.nom?.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  // Create dayOffFormSchema with translations
  const dayOffFormSchema = z.object({
    name: z.string().min(1, t('admin.settings.daysOff.form.validation.nameRequired')),
    countryId: z.number().min(1, t('admin.settings.daysOff.form.validation.countryRequired')),
    dateStart: dateSchema,
    isRecurring: z.boolean().default(false),
    isMultiDay: z.boolean().default(false),
    multiDayDates: multiDaySchema
  });

  type DayOffFormValues = z.infer<typeof dayOffFormSchema>;

  const form = useForm<DayOffFormValues>({
    resolver: zodResolver(dayOffFormSchema),
    defaultValues: {
      name: "",
      countryId: selectedCountry || 0,
      dateStart: {
        day: new Date().getDate(),
        month: new Date().getMonth(),
        year: new Date().getFullYear()
      },
      isRecurring: false,
      isMultiDay: false,
      multiDayDates: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "multiDayDates"
  });

  useEffect(() => {
    if (isEditing && dayOff) {
      try {
        const startDateParts = dayOff.dateStart.split('-');
        const startDate = new Date(
          parseInt(startDateParts[0]),
          parseInt(startDateParts[1]) - 1,
          parseInt(startDateParts[2])
        );

        const endDateParts = dayOff.dateEnd.split('-');
        const endDate = new Date(
          parseInt(endDateParts[0]),
          parseInt(endDateParts[1]) - 1,
          parseInt(endDateParts[2])
        );

        const isMultiDay = dayOff.dateStart !== dayOff.dateEnd;

        const formValues = {
          name: dayOff.name,
          countryId: dayOff.countryId,
          dateStart: {
            day: startDate.getDate(),
            month: startDate.getMonth(),
            year: !!dayOff.isRecurring ? undefined : startDate.getFullYear()
          },
          isRecurring: !!dayOff.isRecurring,
          isMultiDay: isMultiDay,
          multiDayDates: [] as any[]
        };

        if (isMultiDay) {
          const startTime = startDate.getTime();
          const endTime = endDate.getTime();
          const daysDiff = Math.round((endTime - startTime) / (1000 * 60 * 60 * 24));

          for (let i = 1; i <= daysDiff; i++) {
            const nextDate = new Date(startTime + i * 24 * 60 * 60 * 1000);
            formValues.multiDayDates.push({
              day: nextDate.getDate(),
              month: nextDate.getMonth(),
              year: !!dayOff.isRecurring ? undefined : nextDate.getFullYear()
            });
          }
        }

        form.reset(formValues);
      } catch (error) {
        console.error('Error setting form values:', error);
        toast.error(t('admin.settings.daysOff.form.error.loadingData'));
      }
    } else {
      form.reset({
        name: "",
        countryId: selectedCountry || 0,
        dateStart: {
          day: new Date().getDate(),
          month: new Date().getMonth(),
          year: new Date().getFullYear()
        },
        isRecurring: false,
        isMultiDay: false,
        multiDayDates: []
      });
    }
  }, [isEditing, dayOff, form, selectedCountry, t]);

  const isMultiDay = form.watch('isMultiDay');
  const isRecurring = form.watch('isRecurring');

  useEffect(() => {
    if (isRecurring) {
      form.setValue('dateStart.year', undefined);
      form.setValue('multiDayDates', form.getValues('multiDayDates')?.map(date => ({
        ...date,
        year: undefined
      })) || []);
    } else {
      const currentYear = new Date().getFullYear();
      form.setValue('dateStart.year', currentYear);
      form.setValue('multiDayDates', form.getValues('multiDayDates')?.map(date => ({
        ...date,
        year: currentYear
      })) || []);
    }
  }, [isRecurring, form]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const addNewDay = () => {
    const startDay = form.getValues('dateStart');
    let lastDate;
    const multiDayDates = form.getValues('multiDayDates') || [];

    if (multiDayDates.length > 0) {
      lastDate = multiDayDates[multiDayDates.length - 1];
    } else {
      lastDate = startDay;
    }
    const nextDay = { ...lastDate };
    const year = nextDay.year || new Date().getFullYear();
    const month = nextDay.month;
    const day = nextDay.day;
    const dateObj = new Date(year, month, day + 1);
    append({
      day: dateObj.getDate(),
      month: dateObj.getMonth(),
      year: isRecurring ? undefined : dateObj.getFullYear()
    });
  };

  const onSubmit = async (data: DayOffFormValues) => {
    setIsLoading(true);

    try {
      const startDateString = formatDateToYYYYMMDD(data.dateStart);
      let endDateString = startDateString;
      if (data.isMultiDay && data.multiDayDates && data.multiDayDates.length > 0) {
        const lastDate = data.multiDayDates[data.multiDayDates.length - 1];
        endDateString = formatDateToYYYYMMDD(lastDate);
      }
      const payload = {
        name: data.name,
        countryId: Number(data.countryId),
        dateStart: startDateString,
        dateEnd: endDateString,
        isRecurring: data.isRecurring
      };

      console.log("Submitting payload:", payload);

      let success;

      if (isEditing && dayOff) {
        success = await updateDayOff({
          ...payload,
          id: dayOff.id
        });
      } else {
        success = await addDayOff(payload);
      }

      if (success) {
        onSuccess();
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(t(`admin.settings.daysOff.form.error.${isEditing ? 'update' : 'create'}`));
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('admin.settings.daysOff.form.title.edit')
              : t('admin.settings.daysOff.form.title.add')
            }
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('admin.settings.daysOff.form.description.edit')
              : t('admin.settings.daysOff.form.description.add')
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.settings.daysOff.form.fields.name')}*</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('admin.settings.daysOff.form.placeholders.name')}
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.settings.daysOff.form.fields.country')}*</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder={t('admin.settings.daysOff.form.placeholders.country')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="w-full max-h-60">
                          <div className="px-3 py-2 sticky top-0 bg-white z-10 border-b">
                            <Input
                              placeholder={t('admin.settings.daysOff.form.placeholders.searchCountries')}
                              value={countrySearchQuery}
                              onChange={(e) => setCountrySearchQuery(e.target.value)}
                              className="mb-1 h-9"
                            />
                          </div>
                          <ScrollArea className="h-40">
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => (
                                <SelectItem
                                  key={country.id}
                                  value={country.id.toString()}
                                  className="py-2"
                                >
                                  {country.nom}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                {t('admin.settings.daysOff.form.noCountriesFound')}
                              </div>
                            )}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-5 w-5"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('admin.settings.daysOff.form.fields.recurring')}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isMultiDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-5 w-5"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('admin.settings.daysOff.form.fields.multiDay')}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <div className="flex flex-col space-y-3">
                    <h3 className="text-sm font-medium">{t('admin.settings.daysOff.form.fields.date')}:</h3>
                    <div className="flex flex-row gap-3">
                      <FormField
                        control={form.control}
                        name="dateStart.day"
                        render={({ field }) => (
                          <FormItem className="w-full min-w-28">
                            <FormLabel>{t('admin.settings.daysOff.form.fields.day')}</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(Number(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 w-full">
                                  <SelectValue placeholder={t('admin.settings.daysOff.form.placeholders.day')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="w-full max-h-60">
                                <ScrollArea className="h-40">
                                  {dayOptions.map(day => (
                                    <SelectItem
                                      key={`day-${day.value}`}
                                      value={day.value.toString()}
                                      className="py-2"
                                    >
                                      {day.label}
                                    </SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateStart.month"
                        render={({ field }) => (
                          <FormItem className="w-full min-w-32">
                            <FormLabel>{t('admin.settings.daysOff.form.fields.month')}</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(Number(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 w-full">
                                  <SelectValue placeholder={t('admin.settings.daysOff.form.placeholders.month')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="w-full max-h-60">
                                <ScrollArea className="h-40">
                                  {monthOptions.map(month => (
                                    <SelectItem
                                      key={`month-${month.value}`}
                                      value={month.value.toString()}
                                      className="py-2"
                                    >
                                      {t(`admin.settings.daysOff.form.months.${month.value}`)}
                                    </SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!isRecurring && (
                        <FormField
                          control={form.control}
                          name="dateStart.year"
                          render={({ field }) => (
                            <FormItem className="w-full min-w-28">
                              <FormLabel>{t('admin.settings.daysOff.form.fields.year')}</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(Number(value))}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-10 w-full">
                                    <SelectValue placeholder={t('admin.settings.daysOff.form.placeholders.year')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="w-full max-h-60">
                                  <ScrollArea className="h-40">
                                    {yearOptions.map(year => (
                                      <SelectItem
                                        key={`year-${year.value}`}
                                        value={year.value.toString()}
                                        className="py-2"
                                      >
                                        {year.label}
                                      </SelectItem>
                                    ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {isMultiDay && (
                  <div className="md:col-span-2">
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">
                          {t('admin.settings.daysOff.form.fields.additionalDays')}
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addNewDay}
                          className="h-9"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {t('admin.settings.daysOff.form.actions.addDay')}
                        </Button>
                      </div>

                      {fields.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 border border-dashed rounded-md">
                          {t('admin.settings.daysOff.form.additionalDaysPrompt')}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                              <div className="flex-1 grid grid-cols-3 gap-3">
                                <FormField
                                  control={form.control}
                                  name={`multiDayDates.${index}.day`}
                                  render={({ field: dayField }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={(value) => dayField.onChange(Number(value))}
                                        value={dayField.value?.toString()}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="h-10">
                                            <SelectValue placeholder={t('admin.settings.daysOff.form.placeholders.day')} />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-60">
                                          <ScrollArea className="h-40">
                                            {dayOptions.map(day => (
                                              <SelectItem
                                                key={`day-${day.value}-${index}`}
                                                value={day.value.toString()}
                                                className="py-2"
                                              >
                                                {day.label}
                                              </SelectItem>
                                            ))}
                                          </ScrollArea>
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`multiDayDates.${index}.month`}
                                  render={({ field: monthField }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={(value) => monthField.onChange(Number(value))}
                                        value={monthField.value?.toString()}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="h-10">
                                            <SelectValue placeholder={t('admin.settings.daysOff.form.placeholders.month')} />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-60">
                                          <ScrollArea className="h-40">
                                            {monthOptions.map(month => (
                                              <SelectItem
                                                key={`month-${month.value}-${index}`}
                                                value={month.value.toString()}
                                                className="py-2"
                                              >
                                                {t(`admin.settings.daysOff.form.months.${month.value}`)}
                                              </SelectItem>
                                            ))}
                                          </ScrollArea>
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />

                                {!isRecurring && (
                                  <FormField
                                    control={form.control}
                                    name={`multiDayDates.${index}.year`}
                                    render={({ field: yearField }) => (
                                      <FormItem>
                                        <Select
                                          onValueChange={(value) => yearField.onChange(Number(value))}
                                          value={yearField.value?.toString()}
                                        >
                                          <FormControl>
                                            <SelectTrigger className="h-10">
                                              <SelectValue placeholder={t('admin.settings.daysOff.form.placeholders.year')} />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="max-h-60">
                                            <ScrollArea className="h-40">
                                              {yearOptions.map(year => (
                                                <SelectItem
                                                  key={`year-${year.value}-${index}`}
                                                  value={year.value.toString()}
                                                  className="py-2"
                                                >
                                                  {year.label}
                                                </SelectItem>
                                              ))}
                                            </ScrollArea>
                                          </SelectContent>
                                        </Select>
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => remove(index)}
                                aria-label={t('admin.settings.daysOff.form.actions.removeDay')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="h-10"
                >
                  {t('admin.settings.daysOff.form.actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-10"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing
                    ? isLoading
                      ? t('admin.settings.daysOff.form.actions.updating')
                      : t('admin.settings.daysOff.form.actions.update')
                    : isLoading
                      ? t('admin.settings.daysOff.form.actions.creating')
                      : t('admin.settings.daysOff.form.actions.create')
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}