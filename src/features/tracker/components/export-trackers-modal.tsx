'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ConsultantSelect from '@/components/custom/consultant-select';
import { useLanguage } from '@/context/LanguageContext';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Loader2, Calendar, User } from 'lucide-react';

interface ExportTrackersFormValues {
  year: string;
  consultant_id: string;
}

interface ExportTrackersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

const ExportTrackersModal = ({ open, onOpenChange }: ExportTrackersModalProps) => {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  const form = useForm<ExportTrackersFormValues>({
    defaultValues: {
      year: String(currentYear),
      consultant_id: '',
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        year: String(currentYear),
        consultant_id: '',
      });
    }
  }, [open, form]);

  const handleExport = async (values: ExportTrackersFormValues) => {
    setIsExporting(true);
    try {
      const params: Record<string, string> = {};
      if (values.year) params.year = values.year;
      if (values.consultant_id) params.consultant_id = values.consultant_id;

      const response = await apiClient.get(apiRoutes.admin.trackers.export, {
        params,
        responseType: 'blob',
      });

      // Build filename
      const consultantPart = values.consultant_id ? `_consultant-${values.consultant_id}` : '';
      const yearPart = values.year ? `_${values.year}` : '';
      const filename = `trackers${yearPart}${consultantPart}.xlsx`;

      // Trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t('admin.dashboard.exportTrackers.successMessage'));
      onOpenChange(false);
    } catch (error) {
      toast.error(t('admin.dashboard.exportTrackers.errorMessage'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {t('admin.dashboard.exportTrackers.title')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-500 leading-relaxed">
            {t('admin.dashboard.exportTrackers.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleExport)} className="space-y-5 mt-2">

            {/* Year Field */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="h-4 w-4 text-emerald-500" />
                <span>{t('admin.dashboard.exportTrackers.yearLabel')}</span>
                <span className="text-xs text-gray-400 font-normal">
                  ({t('common.optional')})
                </span>
              </div>
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:ring-emerald-500 focus:border-emerald-500">
                          <SelectValue placeholder={t('admin.dashboard.exportTrackers.yearPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              <span className="font-medium">{year}</span>
                              {year === currentYear && (
                                <span className="ml-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                  {t('common.currentYear') || 'Current'}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Consultant Field */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <User className="h-4 w-4 text-emerald-500" />
                <span>{t('admin.dashboard.exportTrackers.consultantLabel')}</span>
                <span className="text-xs text-gray-400 font-normal">
                  ({t('common.optional')})
                </span>
              </div>
              <ConsultantSelect
                name="consultant_id"
                form={form}
                placeholder={t('admin.dashboard.exportTrackers.consultantPlaceholder')}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isExporting}
                  className="px-4"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isExporting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 shadow-sm"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('admin.dashboard.exportTrackers.exporting')}
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      {t('admin.dashboard.exportTrackers.exportButton')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExportTrackersModal;

