'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import {
  FileText,
  Calendar,
  Building,
  ArrowLeft,
  AlertTriangle,
  AlignLeft, User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

import {
  useSubcontractorInvoiceStore,
  SubcontractorInvoice,
  Document
} from '@/stores/subcontractorInvoice-store';
import { formatDate } from '@/lib/format';
import { IconCash } from '@tabler/icons-react';
import { useLanguage } from '@/context/LanguageContext';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
};
const getStatusVariant = (
  status: string
): 'outline' | 'secondary' | 'destructive' | 'default' => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    case 'validated':
      return 'default';
    default:
      return 'outline';
  }
};

const formatAmount = (amount: number | string) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(amount));
};

type InvoiceParams = {
  'subcontractor-InvoiceId': string;
};

function SubcontractorInvoiceDetailContent({ invoiceId }: { invoiceId: string; }) {
  const router = useRouter();
  const { t } = useLanguage();
  //@ts-ignore
  const { getInvoice, validateInvoice, deleteInvoice } =
    useSubcontractorInvoiceStore();
  const [invoice, setInvoice] = useState<SubcontractorInvoice | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getInvoice(invoiceId);

        if (result && result.invoice) {
          setInvoice(result.invoice);
          setDocuments(result.documents || []);
        } else {
          setError(
            t('admin.subcontractor.invoices.errors.loadFailed') ||
              'Failed to load invoice data'
          );
          toast.error(
            t('admin.subcontractor.invoices.errors.loadFailed') ||
              'Failed to load invoice data'
          );
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(
          t('admin.subcontractor.invoices.errors.general') ||
            'An error occurred while loading the invoice'
        );
        toast.error(
          t('admin.subcontractor.invoices.errors.general') ||
            'Error loading invoice data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, getInvoice, t]);

  const handleDeleteModalOpen = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
  };

  const handleDeleteInvoice = async () => {
    try {
      setIsSubmitting(true);
      const response = await apiClient.post(
        apiRoutes.admin.subcontractorInvoices.approve(invoiceId)
      );
      if (response.data.success) {
        toast.success(
          t('admin.subcontractor.invoices.messages.deleteSuccess') ||
            'Invoice deleted successfully'
        );
        router.push('/admin/subcontractor-Invoice');
      } else {
        toast.error(
          t('admin.subcontractor.invoices.errors.deleteFailed') ||
            'Failed to delete invoice'
        );
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toast.error(
        t('admin.subcontractor.invoices.errors.general') ||
          'An error occurred while deleting the invoice'
      );
    } finally {
      setIsSubmitting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleValidateInvoice = async () => {
    try {
      setIsSubmitting(true);

      const response = await apiClient.post(
        apiRoutes.admin.subcontractorInvoices.approve(invoiceId)
      );

      if (response.data.success) {
        toast.success(
          t('admin.subcontractor.invoices.messages.validateSuccess') ||
          'Invoice validated successfully'
        );

        if (invoice) {
          setInvoice({
            ...invoice,
            status: 'validated'
          });
        }
      } else {
        toast.error(
          t('admin.subcontractor.invoices.errors.validateFailed') ||
          'Failed to validate invoice'
        );
      }
    } catch (err) {
      console.error('Error validating invoice:', err);
      toast.error(
        t('admin.subcontractor.invoices.errors.general') ||
        'An error occurred while validating the invoice'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className='w-full space-y-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Heading
              title={
                t('admin.subcontractor.invoices.detail.title') ||
                'Subcontractor Invoice Management'
              }
              description={
                t('admin.subcontractor.invoices.detail.description') ||
                'View and manage subcontractor invoice details'
              }
            />
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => router.back()}
              className='h-9'
              size='sm'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />{' '}
              {t('common.back') || 'Back'}
            </Button>
            {invoice && invoice.status !== 'validated' && (
              <>
                <Button
                  variant='outline'
                  className='border-destructive text-destructive hover:bg-destructive/10'
                  onClick={handleDeleteModalOpen}
                  disabled={isSubmitting}
                  size='sm'
                >
                  {t('common.delete') || 'Delete'}
                </Button>
                <Button
                  variant='default'
                  onClick={handleValidateInvoice}
                  disabled={isSubmitting}
                  size='sm'
                >
                  {isSubmitting
                    ? t('common.processing') || 'Processing...'
                    : t('common.validate') || 'Validate'}
                </Button>
              </>
            )}
          </div>
        </div>
        <Separator />

        {isLoading ? (
          <InvoiceDetailSkeleton />
        ) : error ? (
          <Card className='border-destructive'>
            <CardContent className='pt-6'>
              <div className='text-destructive space-y-2 text-center'>
                <p className='font-medium'>{error}</p>
                <Button variant='outline' onClick={() => router.back()}>
                  {t('common.goBack') || 'Go Back'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : invoice ? (
          <div className='grid gap-5'>

            <Card className='overflow-hidden border pt-0 shadow-sm'>
              <div className='bg-primary/5 border-b px-6 py-5'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 rounded-full p-2'>
                      <FileText className='text-primary h-5 w-5' />
                  </div>
                  <div>
                      <CardTitle className='text-lg font-semibold'>
                      {`${t('admin.subcontractor.invoices.detail.invoiceNumber')} #${invoice.reference}` ||
                        `Invoice #${invoice.reference}`}
                    </CardTitle>
                      <CardDescription className='text-sm'>
                        {t('admin.subcontractor.invoices.detail.issuedOn') ||
                          `Issued on`}{' '}
                      {formatDate(invoice.date_invoice)}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                    className='px-3 py-1.5 text-sm font-medium capitalize'
                  variant={getStatusVariant(invoice.status)}
                >
                    {t(
                      `admin.subcontractor.invoices.status.${invoice.status}`
                    ) || formatStatus(invoice.status)}
                </Badge>
              </div>
              </div>

              <CardContent className='grid gap-6 p-6'>
                <Card className='border shadow-sm'>
                  <CardContent className='p-2'>
                    <div className='mb-2 grid grid-cols-1 gap-2 md:grid-cols-4'>
                  <div>
                        <div className='flex items-center gap-2'>
                          <div className='bg-primary/10 rounded-full p-1'>
                            <FileText className='text-primary h-3 w-3' />
                        </div>
                          <span className='text-m mr-1 font-medium'>
                            {t('admin.subcontractor.invoices.fields.reference')}
                            :
                          </span>
                          <span className='text-sm'>
                          {invoice.reference || t('common.noReference')}
                          </span>
                        </div>
                      </div>

                      {/* Consultant Field - New Addition */}
                      <div>
                        <div className='flex items-center gap-2'>
                          <div className='bg-primary/10 rounded-full p-1'>
                            <User className='text-primary h-3 w-3' />
                          </div>
                          <span className='text-m mr-1 font-medium'>
                            {t(
                              'admin.subcontractor.invoices.fields.consultant')}
                            :
              </span>
                          <span className='text-sm'>
                          {invoice.consultant
                            ? `${invoice.consultant.prenom} ${invoice.consultant.nom}`
                            : t('common.noDataAvailable')}
                          </span>
                        </div>
                      </div>

                      {/* Company Name Field */}
                      <div>
                        <div className='flex items-center gap-2'>
                          <div className='bg-primary/10 rounded-full p-1'>
                            <Building className='text-primary h-3 w-3' />
                          </div>
                          <span className='text-m mr-1 font-medium'>
                {t('admin.subcontractor.invoices.fields.company')}:
              </span>
                          <span className='text-sm'>
                            {invoice.company || t('common.noDataAvailable')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className='flex items-center gap-2'>
                          <div className='bg-primary/10 rounded-full p-1'>
                            <IconCash className='text-primary h-3 w-3' />
                          </div>
                          <span className='text-m mr-1 font-medium'>
                {t('admin.subcontractor.invoices.fields.amount')}:
              </span>
                          <span className='text-sm'>
                          {formatAmount(invoice.total_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Invoice Date Field */}
                      <div>
                        <div className='flex items-center gap-2'>
                          <div className='bg-primary/10 rounded-full p-1'>
                            <Calendar className='text-primary h-3 w-3' />
                          </div>
                          <span className='text-m mr-1 font-medium'>
                {t('admin.subcontractor.invoices.fields.date')}:
              </span>
                          <span className='text-sm'>
                          {invoice.date_invoice
                            ? formatDate(invoice.date_invoice)
                            : t('common.notSpecified')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description - Row 2 */}
                    <div>
                      <div className='flex items-start gap-2'>
                        <div className='bg-primary/10 mt-0.5 rounded-full p-1'>
                          <AlignLeft className='text-primary h-3 w-3' />
                  </div>
                  <div>
                          <span className='text-m mr-1 font-medium'>
                            {t(
                              'admin.subcontractor.invoices.fields.description'
                            )}
                            :
                          </span>
                        {invoice.description ? (
                            <p className='text-s mt-1 whitespace-pre-wrap'>
                            {invoice.description}
                          </p>
                        ) : (
                            <p className='text-muted-foreground mt-1 text-xs italic'>
                              {t(
                                'admin.subcontractor.invoices.messages.noDescription'
                              )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
            {invoice.media && invoice.media.length > 0 ? (
              <Card className='shadow-sm'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='text-primary h-5 w-5' />
                    {t('admin.subcontractor.invoices.documents.title') ||
                      'Supporting Documents'}
                  </CardTitle>
                  <CardDescription>
                    {t('admin.subcontractor.invoices.documents.description') ||
                      'Review submitted invoice documents'}
                  </CardDescription>
                </CardHeader>
                <CardContent className='pt-2'>
                  {invoice.media.map((file) => (
                    <div
                      key={file.id}
                      className='overflow-hidden rounded-lg border'
                    >
                      <div className='bg-muted/30 flex items-center justify-between border-b px-4 py-2'>
                        <div className='font-medium'>
                          {file.name || file.file_name}
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8'
                          onClick={() =>
                            window.open(file.original_url, '_blank')
                          }
                        >
                          {t(
                            'admin.subcontractor.invoices.documents.openInNewTab'
                          ) || 'Open in new tab'}
                        </Button>
                      </div>
                      {file.mime_type === 'application/pdf' && (
                        <iframe
                          src={file.original_url}
                          className='h-[500px] w-full'
                          title={file.name || 'Supporting Document'}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : documents && documents.length > 0 ? (
              <Card className='shadow-sm'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='text-primary h-5 w-5' />
                    {t('admin.subcontractor.invoices.documents.title') ||
                      'Supporting Documents'}
                  </CardTitle>
                  <CardDescription>
                    {t('admin.subcontractor.invoices.documents.description') ||
                      'Review submitted invoice documents'}
                  </CardDescription>
                </CardHeader>
                <CardContent className='pt-2'>
                  {documents.map((file) => (
                    <div
                      key={file.id}
                      className='overflow-hidden rounded-lg border'
                    >
                      <div className='bg-muted/30 flex items-center justify-between border-b px-4 py-2'>
                        <div className='font-medium'>
                          {file.name || file.file_name}
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8'
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          {t(
                            'admin.subcontractor.invoices.documents.openInNewTab'
                          ) || 'Open in new tab'}
                        </Button>
                      </div>
                      {file.mime_type === 'application/pdf' && (
                        <iframe
                          src={file.url}
                          className='h-[500px] w-full'
                          title={file.name || 'Supporting Document'}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className='shadow-sm'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='text-primary h-5 w-5' />
                    {t('admin.subcontractor.invoices.documents.title') ||
                      'Supporting Documents'}
                  </CardTitle>
                </CardHeader>
                <CardContent className='py-8 pt-2'>
                  <div className='text-muted-foreground text-center'>
                    <p>
                      {t(
                        'admin.subcontractor.invoices.documents.noDocuments'
                      ) || 'No supporting documents attached to this invoice'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className='p-6 text-center'>
              <p className='text-muted-foreground'>
                {t('admin.subcontractor.invoices.messages.noInvoiceFound') ||
                  'No invoice found'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {t('admin.subcontractor.invoices.deleteModal.title') ||
                'Delete Invoice'}
            </DialogTitle>
            <DialogDescription>
              {t('admin.subcontractor.invoices.deleteModal.description') ||
                'Are you sure you want to delete this invoice? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              onClick={handleDeleteModalClose}
              disabled={isSubmitting}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleDeleteInvoice}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('admin.subcontractor.invoices.deleteModal.deleting') ||
                  'Deleting...'
                : t('admin.subcontractor.invoices.deleteModal.delete') ||
                  'Delete Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function InvoiceDetailSkeleton() {
  return (
    <div className='grid gap-5'>
      <Card className='overflow-hidden border shadow-sm'>
        <div className='bg-primary/5 border-b px-6 py-5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-9 w-9 rounded-full' />
              <div>
                <Skeleton className='mb-1 h-6 w-64' />
                <Skeleton className='h-4 w-40' />
              </div>
            </div>
            <Skeleton className='h-8 w-24' />
          </div>
        </div>

        <CardContent className='grid gap-6 p-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
          </div>
          <Skeleton className='h-24 w-full' />
        </CardContent>
      </Card>

      <Card className='shadow-sm'>
        <CardHeader className='pb-2'>
          <div className='space-y-2'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-72' />
          </div>
        </CardHeader>
        <CardContent className='pt-2'>
          <Skeleton className='h-[300px] w-full rounded-lg' />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubcontractorInvoiceView({
  params
}: {
  params: Promise<InvoiceParams> | InvoiceParams;
}) {
  const resolvedParams = React.use(params as any) as InvoiceParams;
  return (
    <SubcontractorInvoiceDetailContent
      invoiceId={resolvedParams['subcontractor-InvoiceId']}
    />
  );
}
