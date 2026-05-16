// src/features/settings/banks/bank-form-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Bank, useBanksStore } from '@/stores/banks-store';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useLanguage } from '@/context/LanguageContext';

// Form schema with validation
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must contain at least 2 characters' }),
  bic: z.string().min(8, { message: 'BIC must contain at least 8 characters' })
    .max(11, { message: 'BIC must not be greater than 11 characters' }),
  country_id: z.string().min(1, { message: 'Please select a country' }),
  is_active: z.boolean().default(true),
  iban: z.string().min(1, { message: 'IBAN is required' }),
});

type FormValues = z.infer<typeof formSchema>;

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bank: Bank | null;
}

export function BankModal({ isOpen, onClose, onSuccess, bank }: BankModalProps) {
  const { t } = useLanguage();
  const { countries, fetchCountries, addBank, updateBank } = useBanksStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      bic: '',
      country_id: '',
      is_active: true,
      iban: '',
    },
  });

  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.nom.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  // Load countries when component mounts
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Set form values when editing an existing bank
  useEffect(() => {
    if (bank) {
      form.reset({
        name: bank.name,
        bic: bank.bic,
        country_id: bank.country_id?.toString() || '',
        is_active: bank.is_active,
        iban: bank.iban || '',
      });
    } else {
      form.reset({
        name: '',
        bic: '',
        country_id: '',
        is_active: true,
        iban: '',
      });
    }
  }, [bank, form, isOpen]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Create FormData for submission
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('bic', values.bic);
      formData.append('country_id', values.country_id);
      formData.append('is_active', values.is_active ? '1' : '0');
      formData.append('iban', values.iban || '');

      // Add or update bank
      let success = false;
      if (bank) {
        success = await updateBank(bank.id, formData);
        if (success) {
          toast.success(t('admin.settings.banks.form.messages.updateSuccess'));
          onSuccess();
          onClose();
        }
      } else {
        success = await addBank(formData);
        if (success) {
          toast.success(t('admin.settings.banks.form.messages.createSuccess'));
          onSuccess();
          onClose();
        }
      }
    } catch (error) {
      console.error('Failed to save bank:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {bank ? t('admin.settings.banks.form.editTitle') : t('admin.settings.banks.form.addTitle')}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Bank Name and Country on the same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>{t('admin.settings.banks.form.nameLabel')} *</FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder={t('admin.settings.banks.form.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country_id"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>{t('admin.settings.banks.form.countryLabel')} *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('admin.settings.banks.form.countryPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="px-3 pb-2">
                          <Input
                            placeholder={t('admin.settings.banks.form.searchCountriesPlaceholder')}
                            value={countrySearchTerm}
                            onChange={(e) => setCountrySearchTerm(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => (
                            <SelectItem key={country.id} value={country.id.toString()}>
                              {country.nom}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-center py-2 text-gray-500">
                            {t('admin.settings.banks.form.noCountriesFound')}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* BIC and IBAN in the same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.settings.banks.form.bicLabel')} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t('admin.settings.banks.form.bicPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.settings.banks.form.ibanLabel')} ({t('common.optional')})</FormLabel>
                    <FormControl>
                      <Input placeholder={t('admin.settings.banks.form.ibanPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('admin.settings.banks.form.activeLabel')}</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t('admin.settings.banks.form.activeDescription')}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : bank ? (
                  t('common.update')
                ) : (
                  t('common.add')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}