'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useInvoiceStore } from '@/stores/consultant/invoice-store';
import { useLanguage } from '@/context/LanguageContext';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar } from 'lucide-react';
import { Heading } from '@/components/ui/heading';
import { SingleFileUpload, UploadedFile } from '@/components/custom/singlefile-upload';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { IconCheck, IconFileText, IconReceipt } from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  reference: z.string().min(1, "Reference is required"),
  company: z.string().min(1, "Company name is required"),
  amount: z.coerce.number({
    required_error: "Amount is required",
  })
    .min(0, "Amount cannot be negative")
    .max(999999999.99, "Amount cannot exceed 999,999,999.99"),
  file_path: z.string({ required_error: 'Please upload an invoice document' }),
  description: z.string().optional(),
  invoice_date: z.string().min(1, "Invoice date is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewInvoice() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceDocument, setInvoiceDocument] = useState<UploadedFile | null>(null);
  const { createInvoice, error, loading, validationErrors, clearValidationErrors } = useInvoiceStore();
  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false);
  const { t } = useLanguage();
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference: '',
      company: '',
      amount: 0,
      file_path: '',
      description: '',
      invoice_date: formattedToday,
    },
  });

  // Clear validation errors when unmounting
  useEffect(() => {
    return () => {
      clearValidationErrors();
    };
  }, [clearValidationErrors]);
  useEffect(() => {
    if (validationErrors) {
      Object.entries(validationErrors).forEach(([field, messages]) => {
        let formField = field;
        if (field === 'total_amount') formField = 'amount';
        if (field === 'date_invoice') formField = 'invoice_date';
        if (field === 'supporting_document_path') formField = 'file_path';

        if (messages && messages.length > 0) {
          form.setError(formField as any, {
            type: 'server',
            message: messages[0],
          });
        }
      });
    }
  }, [validationErrors, form]);
  const handleFileChange = (file: UploadedFile | null) => {
    try {
      setInvoiceDocument(file);
      if (file?.path) {
        form.setValue('file_path', file.path);
      } else {
        form.setValue('file_path', "");
      }
    } catch (error) {
      console.error(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }

    return numericValue;
  };
  const formatDateForMySql = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleFormSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    clearValidationErrors();

    try {
      const formattedInvoiceDate = formatDateForMySql(data.invoice_date);
      const invoiceDate = new Date(data.invoice_date);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(invoiceDate.getDate() + 30);
      const formattedDueDate = formatDateForMySql(dueDate.toISOString());

      const result = await createInvoice({
        reference: data.reference,
        company: data.company,
        total_amount: data.amount,
        status: 'pending',
        date_invoice: formattedInvoiceDate,
        due_date: formattedDueDate,
        supporting_document_path: data.file_path,
        description: data.description || '',
      });

      if (result) {
        toast.success(t('consultant.invoices.toasts.createdSuccess'));
        router.push('/consultant/invoices');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  const requiredFieldStyle = <span className="text-red-500 ml-1">*</span>;

  return (
    <PageContainer>
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heading
              title={t('consultant.invoices.new.title')}
              description={t('consultant.invoices.new.description')}
            />
          </div>
          <div className='flex gap-2'>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="h-8"
              size="sm"
            >
              {t('common.back')}
            </Button>
          </div>
        </div>
        <Separator />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconReceipt className="h-5 w-5 text-primary" />
              {t('consultant.invoices.details.title')}
            </CardTitle>
            <CardDescription>
              {t('consultant.invoices.details.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Reference Field */}
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>{t('consultant.invoices.fields.reference')}{requiredFieldStyle}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('consultant.invoices.placeholders.reference')}
                            {...field}
                            className={cn(
                              "w-full",
                              form.formState.errors.reference && "border-red-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  {/* Company Field */}
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>{t('consultant.invoices.fields.company')}{requiredFieldStyle}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('consultant.invoices.placeholders.company')}
                            {...field}
                            className={cn(
                              "w-full",
                              form.formState.errors.company && "border-red-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  {/* Invoice Date Field - Updated to use Calendar component */}
                  <FormField
                    control={form.control}
                    name="invoice_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2">
                          {t('consultant.invoices.fields.invoiceDate')}{requiredFieldStyle}
                        </FormLabel>
                        <Popover
                          open={invoiceDateOpen}
                          onOpenChange={setInvoiceDateOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                  form.formState.errors.invoice_date && "border-red-500"
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {field.value
                                  ? format(new Date(field.value), 'PPP')
                                  : t('consultant.invoices.placeholders.selectDate')}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date.toISOString());
                                  setInvoiceDateOpen(false);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  {/* Amount Field - Modified for manual input */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>{t('consultant.invoices.fields.amount')}{requiredFieldStyle}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2">
                              €
                            </span>
                            <Input
                              type="text"
                              placeholder="0.00"
                              value={field.value}
                              onChange={(e) => {
                                const formattedValue = formatCurrency(e.target.value);
                                field.onChange(parseFloat(formattedValue) || 0);
                              }}
                              className={cn(
                                "w-full pl-7",
                                form.formState.errors.amount && "border-red-500"
                              )}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  {/* Description Field - Full Width */}
                  <div className="col-span-full">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('consultant.invoices.fields.description')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('consultant.invoices.placeholders.description')}
                              className={cn(
                                "resize-y min-h-[100px]",
                                form.formState.errors.description && "border-red-500"
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Invoice Document Upload - Full Width */}
                  <div className="col-span-full">
                    <FormField
                      control={form.control}
                      name="file_path"
                      render={() => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <IconFileText className="h-4 w-4 text-primary" />
                            {t('consultant.invoices.fields.document')}{requiredFieldStyle}
                          </FormLabel>
                          {/* Upload component with proper error handling */}
                          <SingleFileUpload
                            label=""
                            onFileChange={handleFileChange}
                            value={invoiceDocument}
                            description={t('consultant.invoices.placeholders.documentDescription')}
                            accept={{ "application/pdf": [".pdf"] }}
                            maxSize={5}
                            previewHeight="h-72"
                            disabled={isSubmitting}
                            collection="subconstractor_invoice_documents"
                          />
                          <FormDescription>
                            {t('consultant.invoices.fields.documentHelp')}
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/consultant/invoices')}
                    disabled={isSubmitting}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="flex gap-1">
                          <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="h-1 w-1 rounded-full bg-white animate-bounce"></div>
                        </div>
                        <span className="ml-2">{t('common.creating')}</span>
                      </>
                    ) : (
                      <>
                        <IconCheck className="mr-2 h-4 w-4" /> {t('consultant.invoices.actions.create')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}