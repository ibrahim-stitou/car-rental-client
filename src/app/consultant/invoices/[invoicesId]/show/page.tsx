'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import {
  IconReceipt,
  IconFileText,
  IconCalendar,
  IconCash,
  IconArrowBack,
  IconBuilding,
  IconAlignLeft,
  IconAlertTriangle
} from '@tabler/icons-react';

import { useInvoiceStore, Invoice } from '@/stores/consultant/invoice-store';
import { FileText } from 'lucide-react';

// Helper function to format date
const formatDate = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  const monthName = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ][monthIndex];

  return `${day} ${monthName} ${year}`;
};

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};
const getStatusVariant = (status: string | undefined): "outline" | "secondary" | "destructive" | "default" | null | undefined => {
  if (!status) return 'outline';

  switch (status.toLowerCase()) {
    case 'draft': return 'outline';
    case 'pending': return 'secondary';
    case 'paid': return 'default';
    case 'rejected': return 'destructive';
    case 'overdue': return 'destructive';
    default: return 'outline';
  }
};
interface ExtendedInvoice extends Invoice {
  rejection_reason?: string;
  rejections?: {
    id: number;
    reason: string;
    created_at: string;
  }[];
  media?: {
    id: number;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    original_url: string;
    preview_url: string;
    collection_name: string;
    created_at: string;
  }[];
  validation_errors?: {
    reference?: string[];
    company?: string[];
    date_invoice?: string[];
    description?: string[];
    // Add other field errors as needed
  }
}

interface Media {
  id: number;
  name?: string;
  file_name?: string;
  mime_type: string;
  original_url: string;
}
export default function InvoiceView({ params }: { params: Promise<{ invoicesId: string }> }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { getInvoice } = useInvoiceStore();
  const [invoice, setInvoice] = useState<ExtendedInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState({
  });
  const resolvedParams = React.use(params);
  const { invoicesId } = resolvedParams;

  useEffect(() => {
    // Set the invoiceId from the resolved params
    setInvoiceId(invoicesId);
  }, [invoicesId]);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log(`Fetching invoice with ID: ${invoiceId}`);

        const invoiceData = await getInvoice(invoiceId);

        if (invoiceData) {
          // Add validation errors for demo
          const invoiceWithErrors = {
            ...invoiceData,
            validation_errors: validationErrors
          };

          setInvoice(invoiceWithErrors as ExtendedInvoice);
        } else {
          setError(t('consultant.invoices.errors.loadFailed'));
          toast.error(t('consultant.invoices.errors.loadFailed'));
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(t('consultant.invoices.errors.loadFailed'));
        toast.error(t('consultant.invoices.errors.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, getInvoice, validationErrors, t]);

  const handleEditInvoice = () => {
    if (invoiceId) {
      router.push(`/consultant/invoices/${invoiceId}/show`);
    }
  };

  // Function to determine if we have rejection data with null checks
  const hasRejectionData = () => {
    return (
      invoice?.status?.toLowerCase() === 'rejected' &&
      (invoice?.rejection_reason || (invoice?.rejections && invoice.rejections.length > 0))
    );
  };

  // Helper function to check if a field has validation errors
  const hasError = (fieldName: string) => {
    return invoice?.validation_errors && invoice.validation_errors[fieldName as keyof typeof invoice.validation_errors] !== undefined;
  };

  // Helper function to get error message for a field
  const getErrorMessage = (fieldName: string) => {
    if (!invoice?.validation_errors) return null;
    const errors = invoice.validation_errors[fieldName as keyof typeof invoice.validation_errors];
    return errors && errors.length > 0 ? errors[0] : null;
  };

  return (
    <PageContainer>
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heading
              title={t('consultant.invoices.details.title')}
              description={t('consultant.invoices.details.subtitle')}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="h-8"
              size="sm"
            >
              <IconArrowBack className="mr-1 h-3 w-3" /> {t('consultant.invoices.actions.back')}
            </Button>
          </div>
        </div>
        <Separator />

        {isLoading ? (
          <InvoiceDetailSkeleton />
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-4 p-3">
              <div className="text-center text-destructive space-y-2">
                <p className="font-medium">{error}</p>
                <Button variant="outline" onClick={() => router.back()}>
                  {t('consultant.invoices.actions.back')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : invoice ? (
          <div className="grid gap-3">
            {/* Rejection Card - Displayed only when invoice is rejected */}
            {hasRejectionData() && (
              <Card className="shadow-sm border-destructive/50 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <IconAlertTriangle className="h-5 w-5" />
                    {t('consultant.invoices.rejected.title')}
                  </CardTitle>
                  <CardDescription className="text-destructive/80">
                    {t('consultant.invoices.rejected.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="divide-y divide-destructive/20">
                    {invoice.rejections && invoice.rejections.length > 0 ? (
                      // If we have rejection objects
                      invoice.rejections.map((rejection, index) => (
                        <div key={rejection.id || index} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-destructive">{rejection.reason}</p>
                            {rejection.created_at && (
                              <p className="text-xs text-muted-foreground">
                                {formatDate(rejection.created_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : invoice.rejection_reason ? (
                      // If we have a simple rejection reason string
                      <div className="py-3 first:pt-0 last:pb-0">
                        <p className="font-medium text-destructive">{invoice.rejection_reason}</p>
                      </div>
                    ) : (
                      <div className="py-3 first:pt-0 last:pb-0">
                        <p className="font-medium text-destructive">{t('consultant.invoices.rejected.generic')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Invoice Card - Horizontal layout */}
            <Card className="overflow-hidden border shadow-sm pt-0">
              <div className="bg-primary/5 px-4 py-3 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full">
                      <IconReceipt className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {t('consultant.invoices.details.invoiceDetails')}
                      </CardTitle>
                    </div>
                  </div>
                  <Badge
                    className="capitalize px-2 py-1 text-xs font-medium"
                    variant={getStatusVariant(invoice.status)}
                  >
                    {invoice.status || t('consultant.invoices.status.unknown')}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-2">
                {/* Reference, Company, Amount & Date - Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  {/* Reference Field with Error */}
                  <div>
                    {hasError('reference') && (
                      <div className="text-destructive text-xs font-medium mb-1 px-2 py-1 bg-destructive/10 rounded-sm">
                        {getErrorMessage('reference')}
                      </div>
                    )}
                    <div className="flex gap-2 items-center">
                      <div className="bg-primary/10 p-1 rounded-full">
                        <IconFileText className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-m font-medium mr-1">{t('consultant.invoices.fields.reference')}:</span>
                      <span className="text-sm">{invoice.reference || t('consultant.invoices.noData.reference')}</span>
                    </div>
                  </div>

                  {/* Company Name Field with Error */}
                  <div>
                    {hasError('company') && (
                      <div className="text-destructive text-xs font-medium mb-1 px-2 py-1 bg-destructive/10 rounded-sm">
                        {getErrorMessage('company')}
                      </div>
                    )}
                    <div className="flex gap-2 items-center">
                      <div className="bg-primary/10 p-1 rounded-full">
                        <IconBuilding className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-m font-medium mr-1">{t('consultant.invoices.fields.company')}:</span>
                      <span className="text-sm">{invoice.company || t('consultant.invoices.noData.company')}</span>
                    </div>
                  </div>

                  {/* Amount Details */}
                  <div>
                    <div className="flex gap-2 items-center">
                      <div className="bg-primary/10 p-1 rounded-full">
                        <IconCash className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-m font-medium mr-1">{t('consultant.invoices.fields.amount')}:</span>
                      <span className="text-sm">{formatAmount(invoice.total_amount)}</span>
                    </div>
                  </div>

                  {/* Invoice Date Field with Error */}
                  <div>
                    {hasError('date_invoice') && (
                      <div className="text-destructive text-xs font-medium mb-1 px-2 py-1 bg-destructive/10 rounded-sm">
                        {getErrorMessage('date_invoice')}
                      </div>
                    )}
                    <div className="flex gap-2 items-center">
                      <div className="bg-primary/10 p-1 rounded-full">
                        <IconCalendar className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-m font-medium mr-1">{t('consultant.invoices.fields.date')}:</span>
                      <span className="text-sm">{invoice.date_invoice ? formatDate(invoice.date_invoice) : t('consultant.invoices.noData.date')}</span>
                    </div>
                  </div>
                </div>

                {/* Description - Row 2 */}
                <div>
                  {hasError('description') && (
                    <div className="text-destructive text-xs font-medium mb-1 px-2 py-1 bg-destructive/10 rounded-sm">
                      {getErrorMessage('description')}
                    </div>
                  )}
                  <div className="flex gap-2 items-start">
                    <div className="bg-primary/10 p-1 rounded-full mt-0.5">
                      <IconAlignLeft className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <span className="text-m font-medium mr-1">{t('consultant.invoices.fields.description')}:</span>
                      {invoice.description ? (
                        <p className="text-sm whitespace-pre-wrap mt-1">{invoice.description}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic mt-1">{t('consultant.invoices.noData.description')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Section */}
            {invoice && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {t('consultant.invoices.documents.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('consultant.invoices.documents.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {invoice.media && invoice.media.length > 0 ? (
                    // Handle case where invoice has media array
                    invoice.media.map((file: Media) => (
                      <div key={file.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/30 px-4 py-2 border-b flex justify-between items-center">
                          <div className="font-medium">{file.name || file.file_name}</div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => window.open(file.original_url, '_blank')}
                          >
                            {t('consultant.invoices.documents.openInNewTab')}
                          </Button>
                        </div>
                        {file.mime_type === 'application/pdf' && (
                          <iframe
                            src={file.original_url}
                            className="w-full h-[500px]"
                            title={file.name || t('consultant.invoices.documents.supportingDocument')}
                          />
                        )}
                      </div>
                    ))
                  ) : invoice.file || invoice.supporting_document_path ? (
                    // Handle case with single file path
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/30 px-4 py-2 border-b flex justify-between items-center">
                        <div className="font-medium">{t('consultant.invoices.documents.invoiceDocument')}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => window.open(invoice.file || invoice.supporting_document_path, '_blank')}
                        >
                          {t('consultant.invoices.documents.openInNewTab')}
                        </Button>
                      </div>
                      {/* Only render iframe if it's a PDF - you might want to add file type detection */}
                      <iframe
                        src={invoice.file || invoice.supporting_document_path}
                        className="w-full h-[500px]"
                        title={t('consultant.invoices.documents.invoiceDocument')}
                      />
                    </div>
                  ) : (
                    // No documents case
                    <div className="text-center text-muted-foreground py-8">
                      <p>{t('consultant.invoices.documents.noDocuments')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">{t('consultant.invoices.noData.invoice')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

// Skeleton loader for the invoice details
function InvoiceDetailSkeleton() {
  return (
    <div className="grid gap-3">
      <Card className="overflow-hidden border shadow-sm">
        <div className="bg-primary/5 px-4 py-3 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div>
                <Skeleton className="h-5 w-48 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </div>

        <CardContent className="pt-3 pb-3 p-3">
          {/* Reference & Company - Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="flex gap-2 items-center">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2 items-center">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Amount & Date - Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="flex gap-2 items-center">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2 items-center">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Description - Row 3 */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4 mb-1" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="px-4 py-2">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}