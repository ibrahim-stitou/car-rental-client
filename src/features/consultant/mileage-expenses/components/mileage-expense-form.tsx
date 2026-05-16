'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IconCalendar, IconRoute, IconAlertCircle, IconCoin } from '@tabler/icons-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

const createMileageExpenseFormSchema = (t: any) => z.object({
  from_adresse: z.string().min(1, t('consultant.mileageExpenses.form.errors.fromRequired', 'From address is required')),
  to_adresse: z.string().min(1, t('consultant.mileageExpenses.form.errors.toRequired', 'To address is required')),
  distance: z.number().min(0.1, t('consultant.mileageExpenses.form.errors.distanceMinimum', 'Distance must be at least 0.1 km')),
  total_price: z.number().min(0.0, t('consultant.mileageExpenses.form.errors.priceError', 'Price calculation error')),
  date: z.date({
    required_error: t('consultant.mileageExpenses.form.errors.dateRequired', 'Date is required'),
  }),
  description: z.string().optional(),
});
export type MileageExpenseFormValues = z.infer<ReturnType<typeof createMileageExpenseFormSchema>>;
interface MileageExpenseFormProps {
  onSubmit: (data: MileageExpenseFormValues) => Promise<void>;
  onCancelEdit?: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  defaultValues?: Partial<MileageExpenseFormValues>;
  dateFilter?: (date: Date) => boolean;
  mission_id?: string | number;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export default function MileageExpenseForm({
                                             onSubmit,
                                             onCancelEdit,
                                             isSubmitting = false,
                                             isEditing = false,
                                             defaultValues = {
                                               from_adresse: '',
                                               to_adresse: '',
                                               distance: 0,
                                               total_price: 0,
                                               date: new Date(),
                                               description: '',
                                             },
                                             dateFilter,
                                             mission_id,
                                           }: MileageExpenseFormProps) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(isSubmitting);
  const [distanceInfo, setDistanceInfo] = useState<{
    distance: string;
    duration: string;
    status: 'idle' | 'calculating' | 'success' | 'error';
  }>({
    distance: '',
    duration: '',
    status: 'idle',
  });
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);

  // Mileage rate state
  const [mileageRate, setMileageRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [rateError, setRateError] = useState<string | null>(null);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromAutocompleteRef = useRef<any>(null);
  const toAutocompleteRef = useRef<any>(null);

  // Fetch mileage rate on mount
  useEffect(() => {
    setRateLoading(true);

    // Build the API URL with mission_id as query parameter if available
    const apiUrl = mission_id
      ? `${apiRoutes.consultant.settings.showByKey('fkm_taux')}?mission_id=${mission_id}`
      : apiRoutes.consultant.settings.showByKey('fkm_taux');

    apiClient
      .get(apiUrl)
      .then(res => {
        const value = parseFloat(res.data.value);
        if (!isNaN(value)) setMileageRate(value);
        else setMileageRate(0.43);
      })
      .catch(() => {
        setMileageRate(0.43);
        setRateError(t('admin.settings.fkmTaux.fetchError'));
      })
      .finally(() => setRateLoading(false));
  }, [t, mission_id]);

  const form = useForm<MileageExpenseFormValues>({
    resolver: zodResolver(createMileageExpenseFormSchema(t)),
    defaultValues: {
      from_adresse: defaultValues.from_adresse || '',
      to_adresse: defaultValues.to_adresse || '',
      distance: defaultValues.distance || 0,
      total_price: defaultValues.total_price || 0,
      date: defaultValues.date || new Date(),
      description: defaultValues.description || '',
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      setMapsLoaded(true);
      return;
    }

    const loadGoogleMapsScript = () => {
      const googleMapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
      if (!googleMapApiKey) {
        setMapsError(t('consultant.mileageExpenses.form.errors.missingApiKey'));
        return;
      }

      window.initGoogleMaps = () => {
        setMapsLoaded(true);
      };

      if (!document.getElementById('google-maps-script')) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapApiKey}&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;

        script.onerror = () => {
          setMapsError(t('consultant.mileageExpenses.form.errors.failedToLoadApi'));
        };

        document.head.appendChild(script);
      }
    };

    loadGoogleMapsScript();

    return () => {
      if (window.initGoogleMaps) {
        //@ts-ignore
        delete window.initGoogleMaps;
      }
    };
  }, [t]);

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        from_adresse: defaultValues.from_adresse || '',
        to_adresse: defaultValues.to_adresse || '',
        distance: defaultValues.distance || 0,
        total_price: defaultValues.total_price || 0,
        date: defaultValues.date || new Date(),
        description: defaultValues.description || '',
      });
    }
  }, [defaultValues, form]);

  const calculateDistance = useCallback(() => {
    const fromAddress = form.getValues('from_adresse');
    const toAddress = form.getValues('to_adresse');

    if (!window.google || !fromAddress || !toAddress || !mileageRate) {
      return;
    }
    setDistanceInfo(prev => ({ ...prev, status: 'calculating' }));

    const distanceService = new window.google.maps.DistanceMatrixService();

    distanceService.getDistanceMatrix(
      {
        origins: [fromAddress],
        destinations: [toAddress],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response: any, status: string) => {
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          const distanceValue = response.rows[0].elements[0].distance.value / 1000; // Convert to km
          const distanceText = response.rows[0].elements[0].distance.text;
          const durationText = response.rows[0].elements[0].duration.text;
          setDistanceInfo({
            distance: distanceText,
            duration: durationText,
            status: 'success',
          });

          const distance = distanceValue;
          const totalPrice = distance * mileageRate;

          form.setValue('distance', distance);
          form.setValue('total_price', totalPrice);
        } else {
          setDistanceInfo({
            distance: t('consultant.mileageExpenses.form.errors.unableToCalculate'),
            duration: '',
            status: 'error',
          });
          form.setValue('distance', 0);
          form.setValue('total_price', 0);
        }
      }
    );
  }, [form, mileageRate, t]);

  // Initialize autocomplete and event listeners
  const initAutocomplete = useCallback(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    if (!fromInputRef.current || !toInputRef.current) {
      return;
    }
    try {
      fromAutocompleteRef.current = new window.google.maps.places.Autocomplete(
        fromInputRef.current,
        { types: ['address'] }
      );

      toAutocompleteRef.current = new window.google.maps.places.Autocomplete(
        toInputRef.current,
        { types: ['address'] }
      );

      // Set up event listeners for from address
      fromAutocompleteRef.current.addListener('place_changed', () => {
        const place = fromAutocompleteRef.current.getPlace();
        if (place?.formatted_address) {
          form.setValue('from_adresse', place.formatted_address);
          if (form.getValues('to_adresse')) {
            calculateDistance();
          }
        }
      });

      // Set up event listeners for to address
      toAutocompleteRef.current.addListener('place_changed', () => {
        const place = toAutocompleteRef.current.getPlace();
        if (place?.formatted_address) {
          form.setValue('to_adresse', place.formatted_address);
          if (form.getValues('from_adresse')) {
            calculateDistance();
          }
        }
      });

      // Prevent form submission when selecting a place with Enter key
      fromInputRef.current.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });

      toInputRef.current.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });
    } catch (error) {
      setMapsError(t('consultant.mileageExpenses.form.errors.initAutocomplete'));
    }
  }, [form, calculateDistance, t]);

  useEffect(() => {
    if (mapsLoaded) {
      initAutocomplete();
    }
  }, [mapsLoaded, initAutocomplete]);

  // Manual recalculation trigger when addresses change manually
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'from_adresse' || name === 'to_adresse') {
        if (value.from_adresse && value.to_adresse) {
          const fromValue = String(value.from_adresse || '');
          const toValue = String(value.to_adresse || '');
          if (fromValue.length > 5 && toValue.length > 5) {
            calculateDistance();
          } else {
            setDistanceInfo({
              distance: '',
              duration: '',
              status: 'idle',
            });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, calculateDistance]);

  const handleSubmit = async (data: MileageExpenseFormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      if (!isEditing) {
        form.reset({
          from_adresse: '',
          to_adresse: '',
          distance: 0,
          total_price: 0,
          date: defaultValues.date || new Date(),
          description: '',
        });
        setDistanceInfo({
          distance: '',
          duration: '',
          status: 'idle',
        });
      } else {
        setDistanceInfo({
          distance: '',
          duration: '',
          status: 'idle',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setDistanceInfo({
      distance: '',
      duration: '',
      status: 'idle',
    });
  }, [isEditing]);

  if (rateLoading) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200 flex items-center gap-3">
        <span className="text-blue-700">{t('common.loading')}</span>
      </div>
    );
  }

  if (rateError) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200 flex items-center gap-3">
        <IconAlertCircle className="text-red-500" />
        <div>
          <h3 className="font-medium text-red-800">{t('admin.settings.fkmTaux.fetchError')}</h3>
          <p className="text-sm text-red-600">{rateError}</p>
        </div>
      </div>
    );
  }

  if (mapsError) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200 flex items-center gap-3">
        <IconAlertCircle className="text-red-500" />
        <div>
          <h3 className="font-medium text-red-800">{t('consultant.mileageExpenses.form.errors.googleMapsError')}</h3>
          <p className="text-sm text-red-600">{mapsError}</p>
          <p className="text-xs text-red-500 mt-1">
            {t('consultant.mileageExpenses.form.errors.checkApiKey')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* From Address */}
          <FormField
            control={form.control}
            name="from_adresse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('consultant.mileageExpenses.form.fromAddress')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('consultant.mileageExpenses.form.fromAddressPlaceholder')}
                    ref={fromInputRef}
                    onChange={(e) => {
                      field.onChange(e);
                      if (distanceInfo.status !== 'idle') {
                        setDistanceInfo({
                          distance: '',
                          duration: '',
                          status: 'idle',
                        });
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* To Address */}
          <FormField
            control={form.control}
            name="to_adresse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('consultant.mileageExpenses.form.toAddress')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('consultant.mileageExpenses.form.toAddressPlaceholder')}
                    ref={toInputRef}
                    onChange={(e) => {
                      field.onChange(e);
                      if (distanceInfo.status !== 'idle') {
                        setDistanceInfo({
                          distance: '',
                          duration: '',
                          status: 'idle',
                        });
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Distance and Price Information */}
        {distanceInfo.status !== 'idle' && (
          <Card className={cn(
            "transition-all border p-2",
            distanceInfo.status === 'calculating' ? 'bg-blue-50 border-blue-200' :
              distanceInfo.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          )}>
            {distanceInfo.status !== 'success' && (
              <CardHeader className="py-0 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <IconRoute className={cn(
                    "h-4 w-4",
                    distanceInfo.status === 'calculating' ? 'text-blue-500 animate-pulse' :
                      distanceInfo.status === 'error' ? 'text-red-500' : 'text-green-500'
                  )} />
                  {distanceInfo.status === 'calculating'
                    ? t('consultant.mileageExpenses.form.calculating')
                    : t('consultant.mileageExpenses.form.calculationError')}
                </CardTitle>
              </CardHeader>
            )}
            {distanceInfo.status === 'success' && (
              <CardContent className="py-0 px-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{t('consultant.mileageExpenses.form.distance')}: {distanceInfo.distance}</p>
                </div>
                <div className="flex items-center gap-1 text-green-700 bg-green-100 px-3 rounded-full">
                  <IconCoin className="h-3 w-4" />
                  <span className="font-semibold">{form.getValues('total_price').toFixed(2)}€</span>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Date Field */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('consultant.mileageExpenses.form.date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal flex justify-between"
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>{t('consultant.mileageExpenses.form.selectDate')}</span>
                        )}
                        <IconCalendar className="h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      month={field.value || new Date()}
                      disableNavigation
                      onMonthChange={() => {}}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('consultant.mileageExpenses.form.description')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t('consultant.mileageExpenses.form.descriptionPlaceholder')}
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Hidden distance field */}
        <FormField
          control={form.control}
          name="distance"
          render={({ field }) => (
            <input type="hidden" {...field} value={field.value} onChange={field.onChange} />
          )}
        />

        {/* Hidden total_price field */}
        <FormField
          control={form.control}
          name="total_price"
          render={({ field }) => (
            <input type="hidden" {...field} value={field.value} onChange={field.onChange} />
          )}
        />

        <div className="flex justify-end gap-2">
          {isEditing && onCancelEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancelEdit}
              disabled={submitting}
            >
              {t('consultant.mileageExpenses.form.cancel')}
            </Button>
          )}
          <Button
            type="submit"
            disabled={submitting || distanceInfo.status === 'calculating'}
          >
            {submitting
              ? t('consultant.mileageExpenses.form.submitting')
              : isEditing
                ? t('consultant.mileageExpenses.form.updateExpense')
                : t('consultant.mileageExpenses.form.addExpense')}
          </Button>
        </div>
      </form>
    </Form>
  );
}